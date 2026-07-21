"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Play,
  RefreshCcw,
  WandSparkles
} from "lucide-react";
import {
  STYLE_TRANSFER_PRESETS,
  STYLE_TRANSFER_VARIANTS,
  matchStyleTransferPreset,
  type StyleTransferPreset,
  type StyleTransferStyleId,
  type StyleTransferVariantId
} from "@/src/domain/style-transfer";
import {
  DEFAULT_IMAGE_MODEL_CHOICE,
  type ImageModelChoice
} from "@/src/domain/generation-models";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { mapWithConcurrency } from "@/src/lib/concurrency";
import { ImageModelSelector } from "./ImageModelSelector";
import styles from "./StyleTransferStudio.module.css";

const CLIENT_CONCURRENCY = 3;
const PRODUCT_IMAGE_TYPES = new Set<Asset["type"]>([
  "product-photo",
  "phone-shot",
  "white-background-closed",
  "white-background-open",
  "sku-product"
]);

type StyleTransferOutput = {
  id: string;
  url: string;
  model: string;
  prompt: string;
  sourceAssetIds: string[];
  generatedAt: string;
  isFallback: boolean;
  variantId: StyleTransferVariantId;
  variantLabel: string;
};

type RunState = {
  state: "idle" | "running" | "done" | "failed";
  completed: number;
  outputs: StyleTransferOutput[];
  error?: string;
};

const initialRunState: RunState = {
  state: "idle",
  completed: 0,
  outputs: []
};

export function StyleTransferStudio() {
  const defaultPreset = STYLE_TRANSFER_PRESETS.find(
    (preset) => preset.id === "premium-universal"
  ) ?? STYLE_TRANSFER_PRESETS[0];
  const [products, setProducts] = useState<ProductWithProfile[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productId, setProductId] = useState("");
  const [productAssetId, setProductAssetId] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState<StyleTransferStyleId>(defaultPreset.id);
  const [keywords, setKeywords] = useState(defaultPreset.keywords);
  const [keywordsEdited, setKeywordsEdited] = useState(false);
  const [imageModel, setImageModel] = useState<ImageModelChoice>(DEFAULT_IMAGE_MODEL_CHOICE);
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
          setProductId(payload.products[0].id);
        }
      })
      .catch(() => setProductsLoaded(true));

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProduct = products.find((product) => product.id === productId);
  const productImages = useMemo(
    () => selectedProduct?.assets.filter((asset) => PRODUCT_IMAGE_TYPES.has(asset.type)) ?? [],
    [selectedProduct]
  );
  const productAsset = productImages.find((asset) => asset.id === productAssetId);
  const activePreset = useMemo(
    () =>
      keywordsEdited
        ? matchStyleTransferPreset(keywords, selectedStyleId)
        : STYLE_TRANSFER_PRESETS.find((preset) => preset.id === selectedStyleId) ?? defaultPreset,
    [defaultPreset, keywords, keywordsEdited, selectedStyleId]
  );

  useEffect(() => {
    setProductAssetId((current) =>
      productImages.some((asset) => asset.id === current) ? current : productImages[0]?.id ?? ""
    );
  }, [productImages]);

  function choosePreset(preset: StyleTransferPreset) {
    setSelectedStyleId(preset.id);
    setKeywords(preset.keywords);
    setKeywordsEdited(false);
    setRun(initialRunState);
  }

  async function generate() {
    if (!selectedProduct || !productAsset) {
      return;
    }

    const errors: string[] = [];
    setRun({ state: "running", completed: 0, outputs: [] });

    await mapWithConcurrency(
      STYLE_TRANSFER_VARIANTS,
      CLIENT_CONCURRENCY,
      async (variant) => {
        try {
          const response = await fetch("/api/style-transfer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: selectedProduct.id,
              productAssetId: productAsset.id,
              styleId: activePreset.id,
              variantId: variant.id,
              keywords,
              imageModel
            })
          });
          const payload = await response.json();
          if (!response.ok || payload.error || !payload.output) {
            throw new Error(payload.error ?? `Request failed with ${response.status}`);
          }

          const output: StyleTransferOutput = {
            ...payload.output,
            variantId: variant.id,
            variantLabel: variant.label
          };
          setRun((current) => ({
            ...current,
            completed: current.completed + 1,
            outputs: sortOutputs([...current.outputs, output])
          }));
        } catch (error) {
          errors.push(`${variant.label}：${error instanceof Error ? error.message : "生成失败"}`);
          setRun((current) => ({ ...current, completed: current.completed + 1 }));
        }
      }
    );

    setRun((current) => ({
      ...current,
      state: errors.length ? "failed" : "done",
      error: errors.length ? errors.join("；") : undefined
    }));
  }

  if (productsLoaded && products.length === 0) {
    return (
      <section className={styles.emptyState}>
        <ImageIcon aria-hidden size={24} />
        <div>
          <strong>还没有可用产品</strong>
          <p>先建立产品并上传一张清晰产品图，再生成风格场景。</p>
        </div>
        <a href="/assets">到素材库上传产品图</a>
      </section>
    );
  }

  return (
    <div className={styles.studio}>
      <section className={styles.controlBand} aria-label="风格迁移生成设置">
        <div className={styles.controlCopy}>
          <WandSparkles aria-hidden size={20} />
          <div>
            <strong>Keywords 驱动的产品场景生成</strong>
            <span>系统自动匹配 PPT 风格与参考图，并固定输出 3 张不同构图。</span>
          </div>
        </div>
        <div className={styles.controls}>
          <label className={styles.field}>
            产品
            <select
              disabled={run.state === "running"}
              onChange={(event) => {
                setProductId(event.target.value);
                setRun(initialRunState);
              }}
              value={productId}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.displayName ?? product.modelName ?? product.id}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            产品参考图
            <select
              disabled={run.state === "running" || productImages.length === 0}
              onChange={(event) => {
                setProductAssetId(event.target.value);
                setRun(initialRunState);
              }}
              value={productAssetId}
            >
              {productImages.length === 0 ? <option value="">暂无产品图</option> : null}
              {productImages.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.filename}
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
            data-generate-action="true"
            disabled={!selectedProduct || !productAsset || run.state === "running"}
            onClick={generate}
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
              ? `生成中 ${run.completed}/3`
              : `${run.outputs.length ? "重新生成" : "生成"} 3 张场景图`}
          </button>
        </div>
      </section>

      <section className={styles.styleSection} aria-labelledby="style-presets-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="style-presets-heading">风格 Keywords</h2>
            <p>选择预设可填入 PPT Keywords；也可直接修改，系统会按关键词重新匹配风格。</p>
          </div>
          <strong>当前匹配：{activePreset.label}</strong>
        </div>
        <div className={styles.presetGrid}>
          {STYLE_TRANSFER_PRESETS.map((preset) => (
            <button
              aria-pressed={activePreset.id === preset.id}
              className={activePreset.id === preset.id ? styles.presetActive : styles.preset}
              key={preset.id}
              onClick={() => choosePreset(preset)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={preset.references[0].url} />
              <span>
                <strong>{preset.label}</strong>
                <small>{preset.summary}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.productPanel}>
          <div className={styles.panelHeading}>
            <h2>唯一产品参考</h2>
            <span>Image 1 · 锁定产品结构</span>
          </div>
          <div className={styles.productPreview}>
            {productAsset ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="当前产品参考" src={productAsset.url} />
            ) : (
              <div className={styles.productPlaceholder}>
                <ImageIcon aria-hidden size={30} />
                <strong>当前产品没有可用图片</strong>
                <a href="/assets">到素材库上传产品照片</a>
              </div>
            )}
          </div>
        </div>

        <div className={styles.keywordPanel}>
          <div className={styles.panelHeading}>
            <h2>场景 Keywords</h2>
            <span>{keywords.length}/600</span>
          </div>
          <textarea
            aria-label="场景 Keywords"
            disabled={run.state === "running"}
            maxLength={600}
            onChange={(event) => {
              setKeywords(event.target.value);
              setKeywordsEdited(true);
              setRun(initialRunState);
            }}
            value={keywords}
          />
          <div className={styles.matchSummary}>
            <strong>{activePreset.label}</strong>
            <span>{activePreset.summary}</span>
            <small>来源：{activePreset.sourceLabel}</small>
          </div>
        </div>

        <div className={styles.referencePanel}>
          <div className={styles.panelHeading}>
            <h2>风格参考图</h2>
            <span>Image 2+ · 仅学习风格</span>
          </div>
          <div className={styles.referenceGrid}>
            {activePreset.references.map((reference) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={reference.alt} key={reference.id} src={reference.url} />
            ))}
          </div>
        </div>
      </section>

      {run.state === "running" ? (
        <section aria-label="生成进度" className={styles.progressPanel}>
          <div>
            <strong>{activePreset.label}场景生成中</strong>
            <span>{run.completed}/3</span>
          </div>
          <div className={styles.progressTrack}>
            <div style={{ width: `${Math.round((run.completed / 3) * 100)}%` }} />
          </div>
        </section>
      ) : null}

      {run.error ? <section className={styles.error}>部分输出失败：{run.error}</section> : null}

      {run.outputs.length ? (
        <section aria-label="风格迁移结果" className={styles.results}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>{activePreset.label}场景图</h2>
              <p>相同产品与风格，分别采用主视觉、建筑空间和生活方式构图。</p>
            </div>
            <strong>{run.outputs.length}/3 已完成</strong>
          </div>
          <div className={styles.resultGrid}>
            {run.outputs.map((output) => (
              <article className={styles.outputCard} key={output.id}>
                <div className={styles.outputPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={`风格迁移输出：${output.variantLabel}`} src={output.url} />
                </div>
                <div className={styles.outputMeta}>
                  <div>
                    <CheckCircle2 aria-hidden size={16} />
                    <strong>{output.variantLabel}</strong>
                  </div>
                  <span>{output.model}</span>
                  <a href={output.url} target="_blank">
                    <ExternalLink aria-hidden size={14} />
                    打开原图
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function sortOutputs(outputs: StyleTransferOutput[]) {
  const order = STYLE_TRANSFER_VARIANTS.map((variant) => variant.id);
  return outputs.sort(
    (left, right) => order.indexOf(left.variantId) - order.indexOf(right.variantId)
  );
}
