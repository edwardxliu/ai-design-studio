"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  Loader2,
  Play,
  RefreshCcw,
  Trash2
} from "lucide-react";
import { getCompetitionTaskSpec } from "@/src/domain/competition-tasks";
import {
  WHITE_BACKGROUND_ANGLES,
  WHITE_BACKGROUND_SOURCE_OPTIONS,
  type WhiteBackgroundSourceState
} from "@/src/domain/white-background";
import {
  DEFAULT_IMAGE_MODEL_CHOICE,
  type ImageModelChoice
} from "@/src/domain/generation-models";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { mapWithConcurrency } from "@/src/lib/concurrency";
import type { CompetitionOutputArtifact } from "@/src/services/competition-runner";
import { ImageModelSelector } from "./ImageModelSelector";
import styles from "./WhiteBackgroundRunner.module.css";

const TASK_ID = "task1-white-background-6" as const;
const CLIENT_CONCURRENCY = 3;

type RunState = {
  state: "idle" | "running" | "done" | "failed";
  completed: number;
  total: number;
  outputs: CompetitionOutputArtifact[];
  error?: string;
};

type GenerationJob = {
  sourceState: WhiteBackgroundSourceState;
  sourceAsset: Asset;
  outputId: string;
};

const initialRunState: RunState = {
  state: "idle",
  completed: 0,
  total: 0,
  outputs: []
};

export function WhiteBackgroundRunner() {
  const task = getCompetitionTaskSpec(TASK_ID);
  const [products, setProducts] = useState<ProductWithProfile[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productId, setProductId] = useState("");
  const [imageModel, setImageModel] = useState<ImageModelChoice>(DEFAULT_IMAGE_MODEL_CHOICE);
  const [uploading, setUploading] = useState<WhiteBackgroundSourceState | null>(null);
  const [message, setMessage] = useState("");
  const [run, setRun] = useState<RunState>(initialRunState);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.products)) {
          return;
        }
        setProducts(payload.products);
        setProductsLoaded(true);
        if (payload.products[0]) {
          setProductId((current) => current || payload.products[0].id);
        }
      })
      .catch(() => setProductsLoaded(true));

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = products.find((product) => product.id === productId);
  const sourceAssets = useMemo(
    () =>
      Object.fromEntries(
        WHITE_BACKGROUND_SOURCE_OPTIONS.map((option) => [
          option.id,
          selectedProduct ? findLatestSourceAsset(selectedProduct, option.id) : undefined
        ])
      ) as Record<WhiteBackgroundSourceState, Asset | undefined>,
    [selectedProduct]
  );
  const sourceCount = WHITE_BACKGROUND_SOURCE_OPTIONS.filter(
    (option) => sourceAssets[option.id]
  ).length;
  const outputCount = sourceCount * task.outputs.length;
  const progressPercent = run.total
    ? Math.round((run.completed / run.total) * 100)
    : 0;

  async function uploadSource(sourceState: WhiteBackgroundSourceState, file: File) {
    if (!selectedProduct) {
      return;
    }

    setUploading(sourceState);
    setMessage("");
    const option = WHITE_BACKGROUND_SOURCE_OPTIONS.find((item) => item.id === sourceState)!;
    const previousAssets = selectedProduct.assets.filter(
      (asset) => asset.type === option.assetType
    );

    try {
      const form = new FormData();
      form.set("projectId", selectedProduct.projectId);
      form.set("productId", selectedProduct.id);
      form.set("type", option.assetType);
      form.append("files", file);

      const response = await fetch("/api/upload", { method: "POST", body: form });
      const payload = await response.json();
      const uploaded = payload.assets?.[0] as Asset | undefined;

      if (!response.ok || payload.error || !uploaded) {
        throw new Error(payload.error ?? "上传失败");
      }

      await Promise.all(
        previousAssets
          .filter((asset) => asset.source === "uploaded")
          .map((asset) =>
            fetch(`/api/assets?id=${encodeURIComponent(asset.id)}`, { method: "DELETE" })
          )
      );

      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                assets: [
                  ...product.assets.filter((asset) => asset.type !== option.assetType),
                  uploaded
                ]
              }
            : product
        )
      );
      setRun(initialRunState);
      setMessage(`${option.label}已上传：${uploaded.filename}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setUploading(null);
    }
  }

  async function removeSource(sourceState: WhiteBackgroundSourceState) {
    if (!selectedProduct) {
      return;
    }

    const option = WHITE_BACKGROUND_SOURCE_OPTIONS.find((item) => item.id === sourceState)!;
    const matchingAssets = selectedProduct.assets.filter(
      (asset) => asset.type === option.assetType
    );
    setUploading(sourceState);
    setMessage("");

    try {
      const responses = await Promise.all(
        matchingAssets.map((asset) =>
          fetch(`/api/assets?id=${encodeURIComponent(asset.id)}`, { method: "DELETE" })
        )
      );
      if (responses.some((response) => !response.ok)) {
        throw new Error("删除素材失败");
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                assets: product.assets.filter((asset) => asset.type !== option.assetType)
              }
            : product
        )
      );
      setRun(initialRunState);
      setMessage(`${option.label}已移除`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除素材失败");
    } finally {
      setUploading(null);
    }
  }

  async function generate() {
    if (!selectedProduct) {
      return;
    }

    const jobs: GenerationJob[] = WHITE_BACKGROUND_SOURCE_OPTIONS.flatMap((option) => {
      const sourceAsset = sourceAssets[option.id];
      return sourceAsset
        ? task.outputs.map((output) => ({
            sourceState: option.id,
            sourceAsset,
            outputId: output.id
          }))
        : [];
    });

    if (!jobs.length) {
      return;
    }

    setRun({ state: "running", completed: 0, total: jobs.length, outputs: [] });
    setMessage("");
    const errors: string[] = [];

    await mapWithConcurrency(jobs, CLIENT_CONCURRENCY, async (job) => {
      try {
        const response = await fetch("/api/competition/run-output", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: TASK_ID,
            outputId: job.outputId,
            productId: selectedProduct.id,
            imageModel,
            sourceAssetId: job.sourceAsset.id,
            sourceState: job.sourceState
          })
        });
        const payload = await response.json();
        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? `Request failed with ${response.status}`);
        }

        setRun((current) => ({
          ...current,
          completed: current.completed + 1,
          outputs: sortOutputs([
            ...current.outputs,
            payload.output as CompetitionOutputArtifact
          ])
        }));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "生成失败");
        setRun((current) => ({ ...current, completed: current.completed + 1 }));
      }
    });

    setRun((current) => ({
      ...current,
      state: errors.length ? "failed" : "done",
      error: errors.length ? errors.join("；") : undefined
    }));
  }

  if (productsLoaded && products.length === 0) {
    return (
      <section className={styles.emptyState}>
        还没有产品。请先到 <a href="/assets">素材库</a> 创建产品，再回到本页上传开门或关门产品图。
      </section>
    );
  }

  return (
    <div className={styles.runner}>
      <section className={styles.controlBand}>
        <div className={styles.taskCopy}>
          <strong>{task.requirement}</strong>
          <span>{task.summary}</span>
        </div>
        <div className={styles.controls}>
          <label className={styles.field}>
            目标产品
            <select
              disabled={run.state === "running" || uploading !== null}
              onChange={(event) => {
                setProductId(event.target.value);
                setRun(initialRunState);
                setMessage("");
              }}
              value={productId}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.displayName ?? product.id}
                </option>
              ))}
            </select>
          </label>
          <ImageModelSelector
            className={styles.field}
            disabled={run.state === "running"}
            onChange={setImageModel}
            value={imageModel}
          />
          <button
            className={styles.generateButton}
            disabled={!selectedProduct || outputCount === 0 || run.state === "running" || uploading !== null}
            onClick={generate}
            type="button"
          >
            {run.state === "running" ? (
              <Loader2 aria-hidden className={styles.spinner} size={17} />
            ) : run.state === "done" ? (
              <RefreshCcw aria-hidden size={17} />
            ) : (
              <Play aria-hidden size={17} />
            )}
            {run.state === "running"
              ? `生成中 ${run.completed}/${run.total}`
              : `${run.state === "done" ? "重新生成" : "生成"} ${outputCount || 3} 张白底图`}
          </button>
        </div>
      </section>

      <section className={styles.sourceSection} aria-labelledby="source-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="source-heading">产品状态参考图</h2>
            <p>至少上传一张。每个输入槽独立生成左 45°、正视、右 45°三张图片。</p>
          </div>
          <strong>{sourceCount}/2 已上传 · 将生成 {outputCount} 张</strong>
        </div>

        <div className={styles.sourceGrid}>
          {WHITE_BACKGROUND_SOURCE_OPTIONS.map((option) => {
            const asset = sourceAssets[option.id];
            const isUploading = uploading === option.id;
            return (
              <article className={styles.sourceSlot} key={option.id}>
                <div className={styles.slotHeader}>
                  <div>
                    <strong>{option.label}</strong>
                    <span>唯一产品参考 · 固定生成 3 张</span>
                  </div>
                  {asset ? (
                    <button
                      aria-label={`删除${option.label}`}
                      className={styles.iconButton}
                      disabled={uploading !== null || run.state === "running"}
                      onClick={() => removeSource(option.id)}
                      title={`删除${option.label}`}
                      type="button"
                    >
                      <Trash2 aria-hidden size={17} />
                    </button>
                  ) : null}
                </div>

                <div className={styles.previewStage}>
                  {asset ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={option.label} src={asset.url} />
                  ) : (
                    <div className={styles.placeholder}>
                      <ImagePlus aria-hidden size={28} />
                      <span>等待上传</span>
                    </div>
                  )}
                </div>

                <div className={styles.slotFooter}>
                  <span title={asset?.filename}>{asset?.filename ?? "PNG / JPG / WebP"}</span>
                  <label className={styles.uploadButton}>
                    {isUploading ? (
                      <Loader2 aria-hidden className={styles.spinner} size={16} />
                    ) : (
                      <ImagePlus aria-hidden size={16} />
                    )}
                    {asset ? "替换图片" : "上传图片"}
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`上传${option.label}`}
                      disabled={uploading !== null || run.state === "running"}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadSource(option.id, file);
                        }
                        event.target.value = "";
                      }}
                      type="file"
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
        {message ? <p className={styles.message}>{message}</p> : null}
      </section>

      {run.state === "running" ? (
        <section aria-label="生成进度" className={styles.progressPanel}>
          <div>
            <strong>并行生成中 {run.completed}/{run.total}</strong>
            <span>每张参考图分别生成三个独立视角</span>
          </div>
          <div className={styles.progressTrack}>
            <div style={{ width: `${progressPercent}%` }} />
          </div>
        </section>
      ) : null}

      {run.error ? <section className={styles.error}>部分输出失败：{run.error}</section> : null}

      {run.outputs.length ? (
        <section className={styles.results} aria-label="白底三视角生成结果">
          {WHITE_BACKGROUND_SOURCE_OPTIONS.map((option) => {
            const outputs = run.outputs.filter(
              (output) => output.spec.sourceState === option.id
            );
            return outputs.length ? (
              <div className={styles.resultGroup} key={option.id}>
                <div className={styles.resultHeader}>
                  <h2>{option.groupLabel}</h2>
                  <span>{outputs.length}/3 已完成</span>
                </div>
                <div className={styles.resultGrid}>
                  {outputs.map((output) => (
                    <OutputCard key={output.id} output={output} />
                  ))}
                </div>
              </div>
            ) : null;
          })}
        </section>
      ) : null}
    </div>
  );
}

function findLatestSourceAsset(
  product: ProductWithProfile,
  sourceState: WhiteBackgroundSourceState
): Asset | undefined {
  const option = WHITE_BACKGROUND_SOURCE_OPTIONS.find((item) => item.id === sourceState)!;
  return [...product.assets].reverse().find((asset) => asset.type === option.assetType);
}

function sortOutputs(outputs: CompetitionOutputArtifact[]): CompetitionOutputArtifact[] {
  const stateOrder = WHITE_BACKGROUND_SOURCE_OPTIONS.map((option) => option.id);
  const angleOrder = WHITE_BACKGROUND_ANGLES.map((angle) => angle.id);
  return outputs.sort((left, right) => {
    const stateDelta =
      stateOrder.indexOf(left.spec.sourceState ?? "closed") -
      stateOrder.indexOf(right.spec.sourceState ?? "closed");
    if (stateDelta !== 0) {
      return stateDelta;
    }
    return angleOrder.indexOf(left.spec.angle as never) - angleOrder.indexOf(right.spec.angle as never);
  });
}

function OutputCard({ output }: { output: CompetitionOutputArtifact }) {
  return (
    <article className={styles.outputCard}>
      <div className={styles.outputPreview}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={output.spec.label} src={output.url} />
      </div>
      <div className={styles.outputMeta}>
        <div>
          <CheckCircle2 aria-hidden color="#12805c" size={16} />
          <strong>{angleLabel(output.spec.angle)}</strong>
        </div>
        <span>{output.provenance.model}</span>
        <a href={output.url} target="_blank">
          <ExternalLink aria-hidden size={14} />
          打开原图
        </a>
      </div>
    </article>
  );
}

function angleLabel(angleId: string | undefined): string {
  return WHITE_BACKGROUND_ANGLES.find((angle) => angle.id === angleId)?.label ?? angleId ?? "视角";
}
