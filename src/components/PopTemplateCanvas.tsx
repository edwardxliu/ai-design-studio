"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { getPopTemplate, renderPopFlatSvg } from "@/src/domain/pop";
import type {
  PopCanvasRect,
  PopCanvasVariant,
  PopTemplateSet
} from "@/src/domain/pop-template-sets";
import styles from "./PopCanvasStudio.module.css";

export type PopVariantCanvasContent = {
  textValues: Record<string, string>;
  imageDataUris: Record<string, string>;
};

type PopTemplateCanvasProps = {
  templateSet: PopTemplateSet;
  selectedTemplateId: string;
  contentByTemplateId: Record<string, PopVariantCanvasContent>;
  onSelectTemplate: (templateId: string) => void;
  zoom: number;
};

type PreviewEntry = {
  variant: PopCanvasVariant;
  image: HTMLImageElement | null;
};

export function PopTemplateCanvas({
  templateSet,
  selectedTemplateId,
  contentByTemplateId,
  onSelectTemplate,
  zoom
}: PopTemplateCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const variants = useMemo(
    () => templateSet.groups.flatMap((group) => group.variants),
    [templateSet]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const renderScale = Math.min(
      (window.devicePixelRatio || 1) * Math.max(1, zoom),
      4
    );
    canvas.width = Math.round(templateSet.canvas.width * renderScale);
    canvas.height = Math.round(templateSet.canvas.height * renderScale);
    context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    let active = true;
    drawBoard(context, templateSet, selectedTemplateId, []);

    Promise.all(
      variants.map(async (variant): Promise<PreviewEntry> => {
        const content = contentByTemplateId[variant.templateId] ?? {
          textValues: {},
          imageDataUris: {}
        };
        const svg = renderPopFlatSvg({
          templateId: variant.templateId,
          textValues: content.textValues,
          imageDataUris: content.imageDataUris
        });
        return {
          variant,
          image: await loadSvgPreview(svg)
        };
      })
    ).then((previews) => {
      if (active) {
        drawBoard(context, templateSet, selectedTemplateId, previews);
      }
    });

    return () => {
      active = false;
    };
  }, [contentByTemplateId, selectedTemplateId, templateSet, variants, zoom]);

  function selectAtPointer(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * templateSet.canvas.width;
    const y = ((event.clientY - bounds.top) / bounds.height) * templateSet.canvas.height;
    const hit = variants.find((variant) => containsPoint(variant.bounds, x, y));
    if (hit) {
      onSelectTemplate(hit.templateId);
      canvas.focus();
    }
  }

  function cycleSelection(event: KeyboardEvent<HTMLCanvasElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const currentIndex = Math.max(
      0,
      variants.findIndex((variant) => variant.templateId === selectedTemplateId)
    );
    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const nextIndex = (currentIndex + direction + variants.length) % variants.length;
    onSelectTemplate(variants[nextIndex].templateId);
  }

  const selectedTemplate = getPopTemplate(selectedTemplateId);

  return (
    <canvas
      aria-label={
        templateSet.name + "，当前选择 " + selectedTemplate.name + "。方向键切换 Sticker。"
      }
      className={styles.canvas}
      data-selected-template-id={selectedTemplateId}
      data-testid="pop-template-canvas"
      onKeyDown={cycleSelection}
      onPointerDown={selectAtPointer}
      ref={canvasRef}
      role="listbox"
      style={{
        aspectRatio: templateSet.canvas.width + " / " + templateSet.canvas.height,
        width: Math.round(templateSet.canvas.width * zoom) + "px"
      }}
      tabIndex={0}
    />
  );
}

function drawBoard(
  context: CanvasRenderingContext2D,
  templateSet: PopTemplateSet,
  selectedTemplateId: string,
  previews: PreviewEntry[]
) {
  const previewById = new Map(
    previews.map((preview) => [preview.variant.templateId, preview.image])
  );
  const { width, height } = templateSet.canvas;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f5f7f9";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#111827";
  context.font = "700 25px Arial, sans-serif";
  context.fillText(templateSet.name, 30, 42);
  context.fillStyle = "#687585";
  context.font = "14px Arial, sans-serif";
  context.fillText("Midea Overseas POP Sticker System", 30, 68);

  for (const group of templateSet.groups) {
    context.save();
    roundedRectPath(context, group.bounds.x, group.bounds.y, group.bounds.width, group.bounds.height, 4);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#cbd3dc";
    context.lineWidth = 1.5;
    context.stroke();

    context.fillStyle = "#758190";
    context.beginPath();
    context.arc(group.bounds.x + 22, group.bounds.y + 28, 3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#4f5d6b";
    context.font = "600 18px Arial, sans-serif";
    context.fillText(
      fitCanvasText(context, group.name, group.bounds.width - 58),
      group.bounds.x + 40,
      group.bounds.y + 34
    );

    for (const variant of group.variants) {
      drawVariantCard(
        context,
        variant,
        previewById.get(variant.templateId) ?? null,
        variant.templateId === selectedTemplateId
      );
    }
    context.restore();
  }
}

function drawVariantCard(
  context: CanvasRenderingContext2D,
  variant: PopCanvasVariant,
  image: HTMLImageElement | null,
  selected: boolean
) {
  const { x, y, width, height } = variant.bounds;
  const previewBounds = {
    x: x + 5,
    y: y + 5,
    width: width - 10,
    height: height - 10
  };

  context.save();
  context.shadowColor = selected ? "rgba(0, 137, 178, 0.24)" : "rgba(17, 24, 39, 0.08)";
  context.shadowBlur = selected ? 12 : 6;
  context.shadowOffsetY = 2;
  roundedRectPath(context, x, y, width, height, 5);
  context.fillStyle = "#ffffff";
  context.fill();
  context.shadowColor = "transparent";

  if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
    drawContainedImage(context, image, previewBounds);
  } else {
    roundedRectPath(
      context,
      previewBounds.x,
      previewBounds.y,
      previewBounds.width,
      previewBounds.height,
      3
    );
    context.fillStyle = "#eef1f4";
    context.fill();
    context.fillStyle = "#9aa4af";
    context.font = "12px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(
      "Sticker",
      previewBounds.x + previewBounds.width / 2,
      previewBounds.y + previewBounds.height / 2 + 4
    );
    context.textAlign = "start";
  }

  roundedRectPath(context, x, y, width, height, 5);
  context.strokeStyle = selected ? "#0089b2" : "#d8dee5";
  context.lineWidth = selected ? 3 : 1;
  context.stroke();

  context.font = "700 12px Arial, sans-serif";
  const labelWidth = Math.min(
    width - 38,
    Math.max(52, context.measureText(variant.label).width + 18)
  );
  roundedRectPath(context, x + 8, y + 8, labelWidth, 24, 3);
  context.fillStyle = "rgba(255, 255, 255, 0.94)";
  context.fill();
  context.strokeStyle = selected ? "#0089b2" : "#d8dee5";
  context.lineWidth = 1;
  context.stroke();
  context.fillStyle = selected ? "#006f91" : "#596675";
  context.fillText(variant.label, x + 17, y + 24);

  if (selected) {
    context.beginPath();
    context.arc(x + width - 14, y + 14, 10, 0, Math.PI * 2);
    context.fillStyle = "#0089b2";
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x + width - 19, y + 14);
    context.lineTo(x + width - 15, y + 18);
    context.lineTo(x + width - 9, y + 10);
    context.stroke();
  }

  context.restore();
}
function drawContainedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  bounds: PopCanvasRect
) {
  const scale = Math.min(
    bounds.width / image.naturalWidth,
    bounds.height / image.naturalHeight
  );
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(
    image,
    bounds.x + (bounds.width - width) / 2,
    bounds.y + (bounds.height - height) / 2,
    width,
    height
  );
}

function loadSvgPreview(svg: string): Promise<HTMLImageElement | null> {
  if (typeof Image === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function containsPoint(bounds: PopCanvasRect, x: number, y: number): boolean {
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fitCanvasText(
  context: CanvasRenderingContext2D,
  value: string,
  maximumWidth: number
): string {
  if (context.measureText(value).width <= maximumWidth) {
    return value;
  }

  let fitted = value;
  while (fitted.length > 1 && context.measureText(fitted + "…").width > maximumWidth) {
    fitted = fitted.slice(0, -1);
  }
  return fitted + "…";
}
