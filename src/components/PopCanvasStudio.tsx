"use client";

import {
  CookingPot,
  Download,
  ImagePlus,
  Maximize2,
  Move,
  Play,
  Refrigerator,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { Asset, ProductWithProfile } from "@/src/domain/types";
import { parseAspectRatio } from "@/src/domain/image-crop";
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
import { ImageCropDialog } from "./ImageCropDialog";
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

type PendingCrop = {
  file: File;
  target: UploadTarget;
  aspectRatio: number;
};

const MIN_CANVAS_ZOOM = 0.5;
const MAX_CANVAS_ZOOM = 2;
const CANVAS_ZOOM_STEP = 0.25;
const POP_PRODUCT_IMAGE = "/pop/pop-sticker-product.png";

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
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);

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
    () => Array.from(new Set(Object.values(selectedDraft.imageAssetIds).filter(Boolean))),
    [selectedDraft.imageAssetIds]
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
    const imageDataUris = Object.fromEntries(
      Object.entries(selectedDraft.imageAssetIds)
        .filter(([, assetId]) => assetId && dataUriCache[assetId])
        .map(([slotId, assetId]) => [slotId, dataUriCache[assetId]])
    );
    return {
      [selectedTemplateId]: {
        textValues: selectedDraft.textValues,
        imageDataUris
      } satisfies PopVariantCanvasContent
    };
  }, [dataUriCache, selectedDraft.imageAssetIds, selectedDraft.textValues, selectedTemplateId]);

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

  function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const target = uploadTargetRef.current;
    event.target.value = "";
    if (!file || !target || !product) {
      return;
    }

    const template = getPopTemplate(target.templateId);
    setPendingCrop({
      file,
      target,
      aspectRatio: getPopCropAspectRatio(template, target.slotId)
    });
  }

  async function uploadCroppedImage(file: File) {
    const pending = pendingCrop;
    if (!pending || !product) {
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

      const response = await fetch("/api/upload", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || payload.error || !payload.assets?.[0]) {
        throw new Error(payload.error ?? "图片上传失败");
      }

      const uploaded = payload.assets[0] as Asset;
      setAssets((current) => dedupeAssets([...current, uploaded]));
      assignImage(pending.target.templateId, pending.target.slotId, uploaded.id);
      setStatus("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "图片上传失败");
      setStatus("failed");
    } finally {
      setPendingCrop(null);
      uploadTargetRef.current = null;
    }
  }

  function cancelImageCrop() {
    setPendingCrop(null);
    uploadTargetRef.current = null;
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

            <div className={styles.compositorNotice}>
              <Move aria-hidden="true" size={16} />
              在下方产品预览中直接拖动 Sticker，并拖拽右下角控制点调整大小。
            </div>
          </div>
        </aside>
      </div>

      <StickerProductComposer
        flatSvg={flatSvg}
        key={selectedTemplateId}
        templateName={selectedTemplate.name}
      />
      <input
        accept="image/png,image/jpeg,image/webp"
        className={styles.hiddenInput}
        onChange={uploadImage}
        ref={fileInputRef}
        type="file"
      />
      {pendingCrop ? (
        <ImageCropDialog
          aspectRatio={pendingCrop.aspectRatio}
          file={pendingCrop.file}
          onCancel={cancelImageCrop}
          onConfirm={uploadCroppedImage}
          title={`裁切 ${getPopTemplate(pendingCrop.target.templateId).name} 图片`}
        />
      ) : null}
    </section>
  );
}


type StickerPlacement = {
  x: number;
  y: number;
  width: number;
};

type StickerDragState = {
  mode: "move" | "resize";
  pointerId: number;
  startClientX: number;
  startClientY: number;
  initial: StickerPlacement;
  aspectRatio: number;
  heightPercent: number;
};

const DEFAULT_STICKER_PLACEMENT: StickerPlacement = {
  x: 55,
  y: 25,
  width: 25
};

function StickerProductComposer({
  flatSvg,
  templateName
}: {
  flatSvg: string;
  templateName: string;
}) {
  const [placement, setPlacement] = useState<StickerPlacement>(DEFAULT_STICKER_PLACEMENT);
  const [exportState, setExportState] = useState<"idle" | "exporting" | "done" | "failed">("idle");
  const [exportError, setExportError] = useState("");
  const [exportUrl, setExportUrl] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<StickerDragState | null>(null);
  const exportUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (exportUrlRef.current) {
        URL.revokeObjectURL(exportUrlRef.current);
      }
    };
  }, []);

  function resetPlacement() {
    setPlacement(DEFAULT_STICKER_PLACEMENT);
    clearExport();
  }

  function clearExport() {
    if (exportUrlRef.current) {
      URL.revokeObjectURL(exportUrlRef.current);
      exportUrlRef.current = "";
    }
    setExportUrl("");
    setExportState("idle");
    setExportError("");
  }

  function beginDrag(
    event: ReactPointerEvent<HTMLElement>,
    mode: StickerDragState["mode"]
  ) {
    const stage = stageRef.current;
    const sticker = stickerRef.current;
    if (!stage || !sticker) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const stageBounds = stage.getBoundingClientRect();
    const stickerBounds = sticker.getBoundingClientRect();
    const heightPercent = (stickerBounds.height / stageBounds.height) * 100;
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      initial: placement,
      aspectRatio: stickerBounds.width / Math.max(1, stickerBounds.height),
      heightPercent
    };
    stage.setPointerCapture(event.pointerId);
    clearExport();
  }

  function updateDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage || drag.pointerId !== event.pointerId) {
      return;
    }

    const bounds = stage.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startClientX) / bounds.width) * 100;
    const deltaY = ((event.clientY - drag.startClientY) / bounds.height) * 100;

    if (drag.mode === "move") {
      setPlacement({
        ...drag.initial,
        x: clamp(drag.initial.x + deltaX, 0, 100 - drag.initial.width),
        y: clamp(drag.initial.y + deltaY, 0, 100 - drag.heightPercent)
      });
      return;
    }

    const maximumWidth = Math.max(
      8,
      Math.min(
        64,
        100 - drag.initial.x,
        (100 - drag.initial.y) * drag.aspectRatio
      )
    );
    setPlacement({
      ...drag.initial,
      width: clamp(drag.initial.width + deltaX, 8, maximumWidth)
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 5 : 1;
    let next = placement;
    if (event.key === "ArrowLeft") {
      next = { ...placement, x: clamp(placement.x - step, 0, 100 - placement.width) };
    } else if (event.key === "ArrowRight") {
      next = { ...placement, x: clamp(placement.x + step, 0, 100 - placement.width) };
    } else if (event.key === "ArrowUp") {
      next = { ...placement, y: clamp(placement.y - step, 0, 92) };
    } else if (event.key === "ArrowDown") {
      next = { ...placement, y: clamp(placement.y + step, 0, 92) };
    } else {
      return;
    }
    event.preventDefault();
    setPlacement(next);
    clearExport();
  }

  async function exportComposition() {
    setExportState("exporting");
    setExportError("");
    const svgUrl = URL.createObjectURL(
      new Blob([flatSvg], { type: "image/svg+xml;charset=utf-8" })
    );

    try {
      const [productImage, stickerImage] = await Promise.all([
        loadImage(POP_PRODUCT_IMAGE),
        loadImage(svgUrl)
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = productImage.naturalWidth || productImage.width;
      canvas.height = productImage.naturalHeight || productImage.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("浏览器无法创建贴装画布。");
      }

      context.drawImage(productImage, 0, 0, canvas.width, canvas.height);
      const stickerWidth = (placement.width / 100) * canvas.width;
      const stickerHeight =
        stickerWidth *
        ((stickerImage.naturalHeight || stickerImage.height) /
          Math.max(1, stickerImage.naturalWidth || stickerImage.width));
      context.drawImage(
        stickerImage,
        (placement.x / 100) * canvas.width,
        (placement.y / 100) * canvas.height,
        stickerWidth,
        stickerHeight
      );

      const blob = await canvasToBlob(canvas);
      if (exportUrlRef.current) {
        URL.revokeObjectURL(exportUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(blob);
      exportUrlRef.current = nextUrl;
      setExportUrl(nextUrl);
      setExportState("done");

      const anchor = document.createElement("a");
      anchor.href = nextUrl;
      anchor.download = "midea-pop-sticker-composition.png";
      anchor.click();
    } catch (cause) {
      setExportState("failed");
      setExportError(cause instanceof Error ? cause.message : "贴装图导出失败。");
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  const stickerStyle = {
    left: placement.x + "%",
    top: placement.y + "%",
    width: placement.width + "%"
  } as CSSProperties;
  const displaySvg = flatSvg.replace(
    "<svg ",
    '<svg style="width:100%;height:auto;display:block;pointer-events:none" '
  );

  return (
    <section className={styles.compositorSection} aria-labelledby="pop-compositor-title">
      <div className={styles.compositorHeader}>
        <div>
          <p className={styles.eyebrow}>PRODUCT STICKER COMPOSITOR</p>
          <h3 id="pop-compositor-title">产品贴装预览</h3>
          <span>固定演示产品 · {templateName}</span>
        </div>
        <div className={styles.compositorActions}>
          <label className={styles.sizeControl}>
            <span>Sticker 大小</span>
            <input
              aria-label="Sticker 大小"
              max="64"
              min="8"
              onChange={(event) => {
                setPlacement((current) => ({
                  ...current,
                  width: Number(event.target.value)
                }));
                clearExport();
              }}
              step="1"
              type="range"
              value={placement.width}
            />
            <output>{Math.round(placement.width)}%</output>
          </label>
          <button className={styles.resetPlacementButton} onClick={resetPlacement} type="button">
            <RotateCcw aria-hidden="true" size={15} />
            复位
          </button>
          <button
            className={styles.exportButton}
            disabled={exportState === "exporting"}
            onClick={exportComposition}
            type="button"
          >
            <Download aria-hidden="true" size={16} />
            {exportState === "exporting" ? "正在导出" : "导出当前贴装图"}
          </button>
        </div>
      </div>

      <div
        className={styles.compositorStage}
        data-testid="pop-product-compositor"
        onPointerCancel={endDrag}
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        ref={stageRef}
      >
        <img alt="POP 固定演示冰箱产品" draggable={false} src={POP_PRODUCT_IMAGE} />
        <div
          aria-label="可拖动 Sticker"
          className={styles.stickerOverlay}
          onKeyDown={handleKeyboard}
          onPointerDown={(event) => beginDrag(event, "move")}
          ref={stickerRef}
          role="application"
          style={stickerStyle}
          tabIndex={0}
        >
          <div
            className={styles.stickerArtwork}
            dangerouslySetInnerHTML={{ __html: displaySvg }}
          />
          <button
            aria-label="拖动调整 Sticker 大小"
            className={styles.stickerResizeHandle}
            onPointerDown={(event) => beginDrag(event, "resize")}
            type="button"
          >
            <Maximize2 aria-hidden="true" size={13} />
          </button>
        </div>
      </div>

      <div className={styles.compositorFooter}>
        <span>
          <Move aria-hidden="true" size={15} />
          拖动 Sticker 调整位置；拖动右下角控制点或使用滑杆调整大小。
        </span>
        {exportUrl ? (
          <a download="midea-pop-sticker-composition.png" href={exportUrl}>
            <Download aria-hidden="true" size={14} />
            再次下载
          </a>
        ) : null}
        {exportError ? <strong>{exportError}</strong> : null}
      </div>
    </section>
  );
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("贴装素材载入失败。"));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("贴装图导出失败。"))),
      "image/png"
    );
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function getPopCropAspectRatio(template: PopTemplate, slotId: string): number {
  const imageSlotCount = template.slots.filter((slot) => slot.type === "image").length;
  if (imageSlotCount > 1 || /Image\d+$/i.test(slotId)) {
    return 1;
  }
  const overrides: Record<string, number> = {
    "main-sticker-usp": 752 / 918,
    "main-sticker-usp-footer": 752 / 918,
    "inner-sticker-display": 1018 / 552,
    "inner-sticker-display-left": 1.25,
    "inner-sticker-display-right": 1.25,
    "side-sticker": 470 / 168,
    "oven-wobbler": 1,
    "oven-body-round": 1,
    "oven-body-strip": 4,
    "oven-body-feature": 2,
    "oven-top-sticker": 1.25
  };
  return overrides[template.id] ?? parseAspectRatio(template.aspectRatio, 1);
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

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png").split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}
