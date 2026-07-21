"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileSearch,
  ImagePlus,
  Loader2,
  Play,
  RefreshCcw,
  Sparkles,
  Trash2
} from "lucide-react";
import {
  DEFAULT_ICON_VI_PROMPT_TEMPLATE,
  ICON_DESIGN_VARIANTS,
  type IconDesignVariant,
  type IconDesignVariantId
} from "@/src/domain/icon-design";
import {
  DEFAULT_IMAGE_MODEL_CHOICE,
  type ImageModelChoice
} from "@/src/domain/generation-models";
import type { Asset, AssetType } from "@/src/domain/types";
import { mapWithConcurrency } from "@/src/lib/concurrency";
import { ImageModelSelector } from "./ImageModelSelector";
import styles from "./IconDesignStudio.module.css";

const PROJECT_ID = "project-icon-design";
const PRODUCT_ID = "icon-design-workspace";
const CLIENT_CONCURRENCY = 3;

type UploadSlotId = "viColor" | "viStyle" | "sourceIcon";

type UploadSlot = {
  id: UploadSlotId;
  label: string;
  caption: string;
  assetType: AssetType;
};

const UPLOAD_SLOTS: UploadSlot[] = [
  {
    id: "viColor",
    label: "品牌色彩 VI",
    caption: "Image 1",
    assetType: "icon-vi-color"
  },
  {
    id: "viStyle",
    label: "Icon 设计 VI",
    caption: "Image 2",
    assetType: "icon-vi-style"
  },
  {
    id: "sourceIcon",
    label: "待规范化 Icon",
    caption: "Image 3",
    assetType: "icon-source"
  }
];

type IconDesignOutput = {
  id: string;
  variantId: IconDesignVariantId;
  label: string;
  group: "color" | "layout";
  size: string;
  url: string;
  model: string;
  prompt: string;
  sourceAssetIds: string[];
  generatedAt: string;
};

type RunState = {
  state: "idle" | "running" | "done" | "failed";
  completed: number;
  total: number;
  outputs: IconDesignOutput[];
  error?: string;
};

const initialRunState: RunState = {
  state: "idle",
  completed: 0,
  total: 0,
  outputs: []
};

export function IconDesignStudio() {
  const [assets, setAssets] = useState<Partial<Record<UploadSlotId, Asset>>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [uploading, setUploading] = useState<UploadSlotId | null>(null);
  const [parsingVi, setParsingVi] = useState(false);

  const [imageModel, setImageModel] = useState<ImageModelChoice>(DEFAULT_IMAGE_MODEL_CHOICE);
  const [featureTitle, setFeatureTitle] = useState("Twin Crispers");
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_ICON_VI_PROMPT_TEMPLATE);
  const [message, setMessage] = useState("");
  const [run, setRun] = useState<RunState>(initialRunState);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/upload")
      .then((response) => (response.ok ? response.json() : { assets: [] }))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.assets)) {
          return;
        }
        const workspaceAssets = (payload.assets as Asset[]).filter(
          (asset) => asset.productId === PRODUCT_ID
        );
        const restored: Partial<Record<UploadSlotId, Asset>> = {};
        for (const slot of UPLOAD_SLOTS) {
          restored[slot.id] = [...workspaceAssets]
            .reverse()
            .find((asset) => asset.type === slot.assetType);
        }
        setAssets(restored);
      })
      .catch(() => setMessage("无法读取已上传的 Icon Design 素材。"))
      .finally(() => setAssetsLoaded(true));

    return () => {
      cancelled = true;
    };
  }, []);

  const ready = Boolean(assets.viColor && assets.viStyle && assets.sourceIcon && featureTitle.trim());
  const viReady = Boolean(assets.viColor && assets.viStyle);
  const isBusy = uploading !== null || parsingVi || run.state === "running";
  const progressPercent = run.total ? Math.round((run.completed / run.total) * 100) : 0;
  const outputsByVariant = useMemo(
    () => new Map(run.outputs.map((output) => [output.variantId, output])),
    [run.outputs]
  );

  async function uploadAsset(slot: UploadSlot, file: File) {
    const previous = assets[slot.id];
    setUploading(slot.id);
    setMessage("");
    try {
      const form = new FormData();
      form.set("projectId", PROJECT_ID);
      form.set("productId", PRODUCT_ID);
      form.set("type", slot.assetType);
      form.append("files", file);
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const payload = await response.json();
      const uploaded = payload.assets?.[0] as Asset | undefined;
      if (!response.ok || payload.error || !uploaded) {
        throw new Error(payload.error ?? "上传失败");
      }

      if (previous?.source === "uploaded") {
        await fetch(`/api/assets?id=${encodeURIComponent(previous.id)}`, { method: "DELETE" });
      }
      setAssets((current) => ({ ...current, [slot.id]: uploaded }));
      setRun(initialRunState);
      setMessage(`${slot.label}已上传：${uploaded.filename}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(null);
    }
  }

  async function removeAsset(slot: UploadSlot) {
    const asset = assets[slot.id];
    if (!asset) {
      return;
    }
    setUploading(slot.id);
    setMessage("");
    try {
      const response = await fetch(`/api/assets?id=${encodeURIComponent(asset.id)}`, {
        method: "DELETE"
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "删除素材失败");
      }
      setAssets((current) => ({ ...current, [slot.id]: undefined }));
      setRun(initialRunState);
      setMessage(`${slot.label}已移除`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除素材失败");
    } finally {
      setUploading(null);
    }
  }

  async function analyzeVi() {
    if (!assets.viColor || !assets.viStyle) {
      return;
    }
    setParsingVi(true);
    setMessage("");
    try {
      const response = await fetch("/api/icon-design/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viColorAssetId: assets.viColor.id,
          viStyleAssetId: assets.viStyle.id
        })
      });
      const payload = await response.json();
      if (!response.ok || payload.error || !payload.template) {
        throw new Error(payload.error ?? "VI 规范解析失败");
      }
      setPromptTemplate(payload.template);
      setRun(initialRunState);
      setMessage(`VI 规范已解析并应用${payload.model ? `（解析模型：${payload.model}）` : ""}。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "VI 规范解析失败");
    } finally {
      setParsingVi(false);
    }
  }

  async function generateAll() {
    if (!ready || !assets.viColor || !assets.viStyle || !assets.sourceIcon) {
      return;
    }

    setRun({ state: "running", completed: 0, total: ICON_DESIGN_VARIANTS.length, outputs: [] });
    setMessage("");
    const errors: string[] = [];

    await mapWithConcurrency(ICON_DESIGN_VARIANTS, CLIENT_CONCURRENCY, async (variant) => {
      try {
        const response = await fetch("/api/icon-design/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: variant.id,
            viColorAssetId: assets.viColor!.id,
            viStyleAssetId: assets.viStyle!.id,
            sourceIconAssetId: assets.sourceIcon!.id,
            featureTitle: featureTitle.trim(),
            promptTemplate,
            imageModel
          })
        });
        const payload = await response.json();
        if (!response.ok || payload.error || !payload.output) {
          throw new Error(payload.error ?? `${variant.label}生成失败`);
        }
        setRun((current) => ({
          ...current,
          completed: current.completed + 1,
          outputs: sortOutputs([...current.outputs, payload.output as IconDesignOutput])
        }));
      } catch (error) {
        errors.push(`${variant.label}：${error instanceof Error ? error.message : "生成失败"}`);
        setRun((current) => ({ ...current, completed: current.completed + 1 }));
      }
    });

    setRun((current) => ({
      ...current,
      state: errors.length ? "failed" : "done",
      error: errors.length ? errors.join("；") : undefined
    }));
  }

  return (
    <div className={styles.studio}>
      <section className={styles.controlBand}>
        <div className={styles.controlCopy}>
          <span>VI TEMPLATE APPLICATION</span>
          <strong>4 种官方颜色 · 2 种官方版式</strong>
        </div>
        <div className={styles.controls}>
          <ImageModelSelector
            className={styles.modelField}
            disabled={isBusy}
            onChange={setImageModel}
            value={imageModel}
          />
          <button
            className={styles.primaryButton}
            disabled={!ready || isBusy}
            onClick={generateAll}
            type="button"
          >
            {run.state === "running" ? (
              <Loader2 aria-hidden className={styles.spinner} size={17} />
            ) : run.outputs.length ? (
              <RefreshCcw aria-hidden size={17} />
            ) : (
              <Play aria-hidden size={17} />
            )}
            {run.state === "running"
              ? `生成中 ${run.completed}/${run.total}`
              : `${run.outputs.length ? "重新生成" : "生成全部"} 6 个版本`}
          </button>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="vi-heading">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.step}>01</span>
            <h2 id="vi-heading">VI 规范</h2>
          </div>
          <button
            className={styles.secondaryButton}
            disabled={!viReady || isBusy}
            onClick={analyzeVi}
            type="button"
          >
            {parsingVi ? (
              <Loader2 aria-hidden className={styles.spinner} size={16} />
            ) : (
              <FileSearch aria-hidden size={16} />
            )}
            {parsingVi ? "解析中" : "AI 解析 VI 规则"}
          </button>
        </div>
        <div className={styles.viGrid}>
          {UPLOAD_SLOTS.slice(0, 2).map((slot) => (
            <UploadAssetSlot
              asset={assets[slot.id]}
              busy={isBusy}
              key={slot.id}
              loading={uploading === slot.id}
              onRemove={() => removeAsset(slot)}
              onUpload={(file) => uploadAsset(slot, file)}
              slot={slot}
            />
          ))}
        </div>

      </section>

      <section className={styles.section} aria-labelledby="content-heading">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.step}>02</span>
            <h2 id="content-heading">Icon 与卖点</h2>
          </div>
        </div>
        <div className={styles.contentGrid}>
          <UploadAssetSlot
            asset={assets.sourceIcon}
            busy={isBusy}
            loading={uploading === "sourceIcon"}
            onRemove={() => removeAsset(UPLOAD_SLOTS[2])}
            onUpload={(file) => uploadAsset(UPLOAD_SLOTS[2], file)}
            slot={UPLOAD_SLOTS[2]}
          />
          <label className={styles.titleField}>
            卖点标题
            <input
              aria-label="卖点标题"
              disabled={isBusy}
              maxLength={80}
              onChange={(event) => {
                setFeatureTitle(event.target.value);
                setRun(initialRunState);
              }}
              placeholder="Twin Crispers"
              value={featureTitle}
            />
            <span>{featureTitle.trim().length}/80</span>
          </label>
        </div>
      </section>

      {message ? <p className={styles.message}>{message}</p> : null}
      {!assetsLoaded ? <p className={styles.message}>正在读取 Icon Design 素材…</p> : null}

      {run.state === "running" ? (
        <section aria-label="生成进度" className={styles.progressBand}>
          <div>
            <Sparkles aria-hidden size={18} />
            <strong>正在并行生成 {run.completed}/{run.total}</strong>
          </div>
          <div className={styles.progressTrack}>
            <div style={{ width: `${progressPercent}%` }} />
          </div>
        </section>
      ) : null}
      {run.error ? <section className={styles.error}>部分输出失败：{run.error}</section> : null}

      <section className={styles.results} aria-labelledby="result-heading">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.step}>03</span>
            <h2 id="result-heading">规范化输出</h2>
          </div>
          <span className={styles.resultCount}>{run.outputs.length}/6 已生成</span>
        </div>
        <OutputGroup
          outputsByVariant={outputsByVariant}
          title="官方颜色样式"
          variants={ICON_DESIGN_VARIANTS.filter((variant) => variant.group === "color")}
        />
        <OutputGroup
          outputsByVariant={outputsByVariant}
          title="官方图文版式"
          variants={ICON_DESIGN_VARIANTS.filter((variant) => variant.group === "layout")}
        />
      </section>
    </div>
  );
}

function UploadAssetSlot(props: {
  slot: UploadSlot;
  asset?: Asset;
  busy: boolean;
  loading: boolean;
  onUpload(file: File): void;
  onRemove(): void;
}) {
  const { slot, asset, busy, loading, onUpload, onRemove } = props;
  return (
    <article className={styles.uploadSlot}>
      <header>
        <div>
          <span>{slot.caption}</span>
          <strong>{slot.label}</strong>
        </div>
        {asset ? (
          <button
            aria-label={`删除${slot.label}`}
            className={styles.iconButton}
            disabled={busy}
            onClick={onRemove}
            title={`删除${slot.label}`}
            type="button"
          >
            <Trash2 aria-hidden size={16} />
          </button>
        ) : null}
      </header>
      <div className={styles.assetPreview}>
        {asset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={slot.label} src={asset.url} />
        ) : (
          <div className={styles.emptyPreview}>
            <ImagePlus aria-hidden size={28} />
            <span>PNG / JPG / WebP</span>
          </div>
        )}
      </div>
      <footer>
        <span title={asset?.filename}>{asset?.filename ?? "未上传"}</span>
        <label className={styles.uploadButton}>
          {loading ? (
            <Loader2 aria-hidden className={styles.spinner} size={15} />
          ) : (
            <ImagePlus aria-hidden size={15} />
          )}
          {asset ? "替换" : "上传"}
          <input
            accept="image/png,image/jpeg,image/webp"
            aria-label={`上传${slot.label}`}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUpload(file);
              }
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      </footer>
    </article>
  );
}

function OutputGroup(props: {
  title: string;
  variants: IconDesignVariant[];
  outputsByVariant: Map<IconDesignVariantId, IconDesignOutput>;
}) {
  return (
    <div className={styles.outputGroup}>
      <h3>{props.title}</h3>
      <div className={props.variants[0]?.group === "layout" ? styles.layoutGrid : styles.colorGrid}>
        {props.variants.map((variant) => (
          <OutputCard
            key={variant.id}
            output={props.outputsByVariant.get(variant.id)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

function OutputCard({
  variant,
  output
}: {
  variant: IconDesignVariant;
  output?: IconDesignOutput;
}) {
  return (
    <article className={styles.outputCard}>
      <div
        className={styles.outputPreview}
        data-aspect={variant.size === "1536x1024" ? "wide" : "square"}
      >
        {output ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={variant.label} src={output.url} />
        ) : (
          <div className={styles.outputPlaceholder}>
            <span>{variant.id.replaceAll("-", " ")}</span>
          </div>
        )}
      </div>
      <div className={styles.outputMeta}>
        <div>
          {output ? <CheckCircle2 aria-hidden color="#12805c" size={16} /> : null}
          <strong>{variant.label}</strong>
        </div>
        <p>{variant.description}</p>
        {output ? (
          <>
            <span>{output.model}</span>
            <a href={output.url} rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden size={14} /> 打开原图
            </a>
          </>
        ) : null}
      </div>
    </article>
  );
}

function sortOutputs(outputs: IconDesignOutput[]): IconDesignOutput[] {
  const order = ICON_DESIGN_VARIANTS.map((variant) => variant.id);
  return outputs.sort((left, right) => order.indexOf(left.variantId) - order.indexOf(right.variantId));
}