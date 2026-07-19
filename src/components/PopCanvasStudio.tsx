"use client";

import {
  CookingPot,
  ImagePlus,
  Play,
  Refrigerator,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent
} from "react";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { DEFAULT_IMAGE_MODEL_CHOICE, type ImageModelChoice } from "@/src/domain/generation-models";
import {
  allPopTemplates,
  getPopTemplate,
  renderPopFlatSvg,
  type PopTemplate
} from "@/src/domain/pop";
import {
  getPopStickerGroup,
  getPopTemplateIds,
  getPopTemplateSet,
  inferPopProductType,
  type PopProductType
} from "@/src/domain/pop-template-sets";
import {
  PopTemplateCanvas,
  type PopVariantCanvasContent
} from "./PopTemplateCanvas";
import { ImageModelSelector } from "./ImageModelSelector";
import styles from "./PopCanvasStudio.module.css";

type SceneResponse = {
  flatUrl: string;
  flatPngUrl?: string;
  templateId: string;
  templateVersion: string;
  scene: {
    url: string;
    model: string;
    isFallback: boolean;
    failureReason?: string;
  };
  error?: string;
};

type PopTemplateDraft = {
  textValues: Record<string, string>;
  imageAssetIds: Record<string, string>;
};

type EditorStatus =
  | "idle"
  | "uploading"
  | "generating"
  | "done"
  | "failed";

type UploadTarget = {
  templateId: string;
  slotId: string;
};

const MIN_CANVAS_ZOOM = 0.5;
const MAX_CANVAS_ZOOM = 2;
const CANVAS_ZOOM_STEP = 0.25;

export function PopCanvasStudio({ products }: { products: ProductWithProfile[] }) {
  const initialProduct = products[0];
  const initialProductType = initialProduct
    ? inferPopProductType(initialProduct)
    : "refrigerator";
  const initialTemplateSet = getPopTemplateSet(initialProductType);
  const initialTemplateId = getPopTemplateIds(initialTemplateSet)[0] ?? "";

  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [imageModel, setImageModel] = useState<ImageModelChoice>(DEFAULT_IMAGE_MODEL_CHOICE);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [drafts, setDrafts] = useState<Record<string, PopTemplateDraft>>(
    buildInitialDrafts
  );
  const [assets, setAssets] = useState<Asset[]>(() =>
    dedupeAssets(products.flatMap((product) => product.assets))
  );
  const [dataUriCache, setDataUriCache] = useState<Record<string, string>>({});
  const [productAssetId, setProductAssetId] = useState("");
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [placement, setPlacement] = useState(
    getPopTemplate(initialTemplateId).placementHints[0] ?? "front panel"
  );
  const [status, setStatus] = useState<EditorStatus>("idle");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SceneResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<UploadTarget | null>(null);

  const product =
    products.find((item) => item.id === productId) ?? products[0];
  const productType: PopProductType = product
    ? inferPopProductType(product)
    : "refrigerator";
  const templateSet = getPopTemplateSet(productType);
  const templateIds = useMemo(
    () => getPopTemplateIds(templateSet),
    [templateSet]
  );
  const selectedTemplate = getPopTemplate(selectedTemplateId);
  const selectedGroup = getPopStickerGroup(templateSet, selectedTemplateId);
  const selectedDraft =
    drafts[selectedTemplateId] ?? buildDefaultDraft(selectedTemplate);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/upload")
      .then((response) => (response.ok ? response.json() : { assets: [] }))
      .then((payload) => {
        if (!cancelled && Array.isArray(payload.assets)) {
          setAssets((current) =>
            dedupeAssets([...current, ...(payload.assets as Asset[])])
          );
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedImageIds = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(drafts).flatMap((draft) =>
            Object.values(draft.imageAssetIds).filter(Boolean)
          )
        )
      ),
    [drafts]
  );

  useEffect(() => {
    const wanted = selectedImageIds.filter(
      (assetId) => assetId && !dataUriCache[assetId]
    );
    if (!wanted.length) {
      return;
    }

    let cancelled = false;
    void (async () => {
      for (const assetId of wanted) {
        const asset = assets.find((item) => item.id === assetId);
        if (!asset) {
          continue;
        }
        try {
          const response = await fetch(asset.url);
          const blob = await response.blob();
          const dataUri = await blobToDataUri(blob);
          if (!cancelled) {
            setDataUriCache((current) => ({
              ...current,
              [assetId]: dataUri
            }));
          }
        } catch {
          // The Canvas keeps the gray placeholder when an asset cannot be read.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assets, dataUriCache, selectedImageIds]);

  const imageAssets = useMemo(
    () => assets.filter(isRasterImage),
    [assets]
  );
  const productPhotoOptions = useMemo(
    () =>
      imageAssets.filter(
        (asset) =>
          asset.type === "product-photo" &&
          (!asset.productId || asset.productId === product?.id)
      ),
    [imageAssets, product?.id]
  );
  const effectiveProductAssetId =
    productAssetId || productPhotoOptions[0]?.id || "";

  const contentByTemplateId = useMemo(() => {
    const entries = templateIds.map((templateId) => {
      const draft =
        drafts[templateId] ?? buildDefaultDraft(getPopTemplate(templateId));
      const imageDataUris = Object.fromEntries(
        Object.entries(draft.imageAssetIds)
          .filter(([, assetId]) => assetId && dataUriCache[assetId])
          .map(([slotId, assetId]) => [slotId, dataUriCache[assetId]])
      );
      return [
        templateId,
        {
          textValues: draft.textValues,
          imageDataUris
        } satisfies PopVariantCanvasContent
      ] as const;
    });
    return Object.fromEntries(entries);
  }, [dataUriCache, drafts, templateIds]);

  const flatSvg = useMemo(() => {
    const content = contentByTemplateId[selectedTemplateId] ?? {
      textValues: selectedDraft.textValues,
      imageDataUris: {}
    };
    return renderPopFlatSvg({
      templateId: selectedTemplateId,
      textValues: content.textValues,
      imageDataUris: content.imageDataUris
    });
  }, [contentByTemplateId, selectedDraft.textValues, selectedTemplateId]);

  const previewSvg = useMemo(
    () =>
      flatSvg.replace(
        "<svg ",
        '<svg style="width:100%;height:auto;display:block" '
      ),
    [flatSvg]
  );

  function switchProduct(nextProductId: string) {
    const nextProduct =
      products.find((item) => item.id === nextProductId) ?? products[0];
    if (!nextProduct) {
      return;
    }

    const nextSet = getPopTemplateSet(inferPopProductType(nextProduct));
    const nextTemplateId = getPopTemplateIds(nextSet)[0];
    const nextTemplate = getPopTemplate(nextTemplateId);

    setProductId(nextProduct.id);
    setSelectedTemplateId(nextTemplateId);
    setPlacement(nextTemplate.placementHints[0] ?? "front panel");
    setProductAssetId("");
    markDirty();
  }

  function selectTemplate(nextTemplateId: string) {
    if (!templateIds.includes(nextTemplateId)) {
      return;
    }
    const nextTemplate = getPopTemplate(nextTemplateId);
    setSelectedTemplateId(nextTemplateId);
    setPlacement(nextTemplate.placementHints[0] ?? "front panel");
    markDirty();
  }

  function updateText(slotId: string, value: string) {
    updateDraft(selectedTemplateId, (draft) => ({
      ...draft,
      textValues: {
        ...draft.textValues,
        [slotId]: value
      }
    }));
  }

  function assignImage(templateId: string, slotId: string, assetId: string) {
    updateDraft(templateId, (draft) => ({
      ...draft,
      imageAssetIds: {
        ...draft.imageAssetIds,
        [slotId]: assetId
      }
    }));
  }

  function updateDraft(
    templateId: string,
    updater: (draft: PopTemplateDraft) => PopTemplateDraft
  ) {
    setDrafts((current) => {
      const template = getPopTemplate(templateId);
      const draft = current[templateId] ?? buildDefaultDraft(template);
      return {
        ...current,
        [templateId]: updater(draft)
      };
    });
    markDirty();
  }

  function requestImageUpload(slotId: string) {
    uploadTargetRef.current = {
      templateId: selectedTemplateId,
      slotId
    };
    fileInputRef.current?.click();
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = uploadTargetRef.current;
    event.target.value = "";
    if (!file || !target || !product) {
      return;
    }

    setStatus("uploading");
    setError("");
    try {
      const form = new FormData();
      form.set("projectId", product.projectId);
      form.set("productId", product.id);
      form.set("type", "pop-input");
      form.append("files", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok || payload.error || !payload.assets?.[0]) {
        throw new Error(payload.error ?? "图片上传失败");
      }

      const uploaded = payload.assets[0] as Asset;
      setAssets((current) => dedupeAssets([...current, uploaded]));
      assignImage(target.templateId, target.slotId, uploaded.id);
      setStatus("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片上传失败");
      setStatus("failed");
    } finally {
      uploadTargetRef.current = null;
    }
  }

  async function generateScene() {
    if (!product || !selectedTemplate) {
      return;
    }

    setStatus("generating");
    setStage("1/3 正在栅格化所选 Sticker");
    setError("");
    setResult(null);

    try {
      const popImageBase64 = await rasterizeSvg(flatSvg);
      setStage("2/3 正在生成写实贴装产品图");

      const response = await fetch("/api/pop/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: "task-pop-" + selectedTemplate.id + "-" + Date.now(),
          templateId: selectedTemplate.id,
          productId: product.id,
          productAssetId: effectiveProductAssetId || undefined,
          placement,
          textValues: selectedDraft.textValues,
          imageAssetIds: selectedDraft.imageAssetIds,
          imageModel,
          popImageBase64
        })
      });
      const payload: SceneResponse = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Request failed with " + response.status);
      }

      setStage("3/3 完成");
      setResult(payload);
      setStatus("done");
    } catch (cause) {
      setStage("");
      setError(
        cause instanceof Error ? cause.message : "POP 写实贴装生成失败"
      );
      setStatus("failed");
    }
  }

  function markDirty() {
    setResult(null);
    setError("");
    setStage("");
    setStatus("idle");
  }

  if (!product) {
    return null;
  }

  const ProductTypeIcon = productType === "oven" ? CookingPot : Refrigerator;
  const productTypeLabel = productType === "oven" ? "烤箱模板" : "冰箱模板";
  const statusLabel =
    status === "generating"
      ? "生成中"
      : status === "uploading"
        ? "上传中"
        : status === "done"
          ? "已生成"
          : status === "failed"
            ? "失败"
            : "就绪";

  return (
    <section className={styles.studio}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>POP TEMPLATE CANVAS</p>
          <h2>产品类型 Sticker 工作台</h2>
        </div>
        <span
          className={
            status === "done"
              ? styles.status + " " + styles.statusDone
              : status === "failed"
                ? styles.status + " " + styles.statusFailed
                : styles.status
          }
        >
          {statusLabel}
        </span>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.field}>
          产品
          <select
            aria-label="产品"
            onChange={(event) => switchProduct(event.target.value)}
            value={product.id}
          >
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName ?? item.id}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.field}>
          产品类型模板
          <div className={styles.productType} data-testid="pop-product-type">
            <ProductTypeIcon aria-hidden="true" size={18} strokeWidth={1.8} />
            {productTypeLabel}
          </div>
        </div>

        <label className={styles.field}>
          产品参考图
          <select
            aria-label="产品参考图"
            onChange={(event) => setProductAssetId(event.target.value)}
            value={productAssetId}
          >
            <option value="">默认产品主图</option>
            {productPhotoOptions.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.filename}
              </option>
            ))}
          </select>
        </label>

        <ImageModelSelector
          className={styles.field}
          disabled={status === "generating" || status === "uploading"}
          onChange={setImageModel}
          value={imageModel}
        />

      </div>

      <div className={styles.workspace}>
        <div className={styles.canvasPane}>
          <div className={styles.canvasHeader}>
            <div className={styles.canvasTitle}>
              <strong>{templateSet.name}</strong>
              <span>
                {selectedGroup?.name ?? "Sticker"} / {selectedTemplate.name}
              </span>
            </div>
            <div className={styles.zoomControls}>
              <button
                aria-label="缩小 POP 画布"
                disabled={canvasZoom <= MIN_CANVAS_ZOOM}
                onClick={() =>
                  setCanvasZoom((current) =>
                    Math.max(MIN_CANVAS_ZOOM, current - CANVAS_ZOOM_STEP)
                  )
                }
                title="缩小 POP 画布"
                type="button"
              >
                <ZoomOut aria-hidden="true" size={17} />
              </button>
              <input
                aria-label="POP 画布缩放"
                max={MAX_CANVAS_ZOOM * 100}
                min={MIN_CANVAS_ZOOM * 100}
                onChange={(event) =>
                  setCanvasZoom(Number(event.target.value) / 100)
                }
                step={CANVAS_ZOOM_STEP * 100}
                type="range"
                value={canvasZoom * 100}
              />
              <output>{Math.round(canvasZoom * 100)}%</output>
              <button
                aria-label="放大 POP 画布"
                disabled={canvasZoom >= MAX_CANVAS_ZOOM}
                onClick={() =>
                  setCanvasZoom((current) =>
                    Math.min(MAX_CANVAS_ZOOM, current + CANVAS_ZOOM_STEP)
                  )
                }
                title="放大 POP 画布"
                type="button"
              >
                <ZoomIn aria-hidden="true" size={17} />
              </button>
            </div>
          </div>
          <div className={styles.canvasViewport}>
            <PopTemplateCanvas
              contentByTemplateId={contentByTemplateId}
              onSelectTemplate={selectTemplate}
              selectedTemplateId={selectedTemplateId}
              templateSet={templateSet}
              zoom={canvasZoom}
            />
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <i className={styles.blueSwatch} />
              文字区域
            </span>
            <span className={styles.legendItem}>
              <i className={styles.graySwatch} />
              图片区域
            </span>
            <span className={styles.legendItem}>
              <i className={styles.selectedSwatch} />
              当前 Sticker
            </span>
          </div>
        </div>

        <aside className={styles.inspector}>
          <div className={styles.inspectorHeader}>
            <p>{selectedGroup?.name ?? "Sticker"}</p>
            <h3>{selectedTemplate.name}</h3>
          </div>

          <div className={styles.inspectorFields}>
            <label className={styles.field}>
              当前 Sticker
              <select
                aria-label="当前 Sticker"
                onChange={(event) => selectTemplate(event.target.value)}
                value={selectedTemplateId}
              >
                {templateSet.groups.map((group) => (
                  <optgroup key={group.id} label={group.name}>
                    {group.variants.map((variant) => (
                      <option key={variant.templateId} value={variant.templateId}>
                        {variant.label} · {getPopTemplate(variant.templateId).name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            {selectedTemplate.slots.map((slot) =>
              slot.type === "text" ? (
                <label className={styles.field} key={slot.id}>
                  {slot.label}
                  <input
                    maxLength={slot.maxLength}
                    onChange={(event) => updateText(slot.id, event.target.value)}
                    value={selectedDraft.textValues[slot.id] ?? ""}
                  />
                </label>
              ) : (
                <div className={styles.imageControl} key={slot.id}>
                  <label className={styles.field}>
                    {slot.label}
                    <select
                      aria-label={slot.label}
                      onChange={(event) =>
                        assignImage(
                          selectedTemplateId,
                          slot.id,
                          event.target.value
                        )
                      }
                      value={selectedDraft.imageAssetIds[slot.id] ?? ""}
                    >
                      <option value="">灰色占位</option>
                      {imageAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.filename}
                          {asset.source === "uploaded" ? "（已上传）" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    aria-label={"上传" + slot.label}
                    className={styles.iconButton}
                    disabled={status === "uploading" || status === "generating"}
                    onClick={() => requestImageUpload(slot.id)}
                    title={"上传" + slot.label}
                    type="button"
                  >
                    <ImagePlus aria-hidden="true" size={18} />
                  </button>
                </div>
              )
            )}

            <label className={styles.field}>
              贴装位置
              <select
                onChange={(event) => setPlacement(event.target.value)}
                value={placement}
              >
                {selectedTemplate.placementHints.map((hint) => (
                  <option key={hint}>{hint}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.generateButton}
              disabled={status === "generating" || status === "uploading"}
              onClick={generateScene}
              type="button"
            >
              <Play aria-hidden="true" fill="currentColor" size={17} />
              {status === "generating" ? "生成中" : "生成所选 Sticker 贴装图"}
            </button>

            {stage ? (
              <div aria-live="polite" className={styles.stage}>
                {stage}
              </div>
            ) : null}
            {error ? <div className={styles.error}>{error}</div> : null}
          </div>
        </aside>
      </div>

      {result ? (
        <section className={styles.result}>
          <div className={styles.resultHeader}>
            <h3>生成结果</h3>
            <span className={styles.resultMode}>{result.scene.model}</span>
          </div>

          <div className={styles.resultGrid}>
            <div className={styles.flatPreview}>
              <p className={styles.resultLabel}>所选 Sticker 平面稿</p>
              <div
                data-testid="selected-pop-flat-preview"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            </div>
            <div className={styles.scenePreview}>
              <p className={styles.resultLabel}>写实产品贴装图</p>
              <img alt="POP 写实贴装场景" src={result.scene.url} />
            </div>
          </div>

          <p className={styles.links}>
            平面稿：
            <a href={result.flatUrl} rel="noreferrer" target="_blank">
              {result.flatUrl}
            </a>
            {result.flatPngUrl ? (
              <>
                {" · PNG："}
                <a href={result.flatPngUrl} rel="noreferrer" target="_blank">
                  {result.flatPngUrl}
                </a>
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <input
        accept="image/png,image/jpeg,image/webp"
        className={styles.hiddenInput}
        onChange={uploadImage}
        ref={fileInputRef}
        type="file"
      />
    </section>
  );
}

function buildInitialDrafts(): Record<string, PopTemplateDraft> {
  return Object.fromEntries(
    allPopTemplates.map((template) => [
      template.id,
      buildDefaultDraft(template)
    ])
  );
}

function buildDefaultDraft(template: PopTemplate): PopTemplateDraft {
  return {
    textValues: Object.fromEntries(
      template.slots
        .filter((slot) => slot.type === "text")
        .map((slot) => [
          slot.id,
          slot.type === "text" ? slot.defaultValue : ""
        ])
    ),
    imageAssetIds: {}
  };
}

function dedupeAssets(assets: Asset[]): Asset[] {
  return Array.from(
    new Map(assets.map((asset) => [asset.id, asset])).values()
  );
}

function isRasterImage(asset: Asset): boolean {
  return /\.(png|jpe?g|webp)$/i.test(asset.url);
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function rasterizeSvg(svg: string): Promise<string | undefined> {
  const blob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Sticker 栅格化失败"));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    canvas.width = Math.max(1, width * 2);
    canvas.height = Math.max(1, height * 2);
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png").split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}
