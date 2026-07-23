"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent
} from "react";
import {
  getPdpCanvasColumnLabel,
  movePdpCanvasBlock,
  type PdpCanvasBlock,
  type PdpCanvasLayout
} from "@/src/domain/pdp-canvas-layout";
import type { SellingPoint } from "@/src/domain/types";
import styles from "./PdpEditor.module.css";

const PDP_BRAND_IMAGE_URL = "/pdp/midea-brand-no1.png";

type PdpCanvasProps = {
  layout: PdpCanvasLayout;
  points: SellingPoint[];
  productName: string;
  brandName: string;
  coverTitle: string;
  coverSubtitle: string;
  country: string;
  language: string;
  imageUrlByBlockId: Record<string, string | undefined>;
  selectedBlockId: string;
  zoom: number;
  onLayoutChange: (layout: PdpCanvasLayout) => void;
  onSelectBlock: (blockId: string) => void;
  onDragEnd: (layout: PdpCanvasLayout) => void;
  onRequestImage: (blockId: string) => void;
};

type DragState = {
  pointerId: number;
  blockId: string;
  offsetX: number;
  offsetY: number;
  latestLayout: PdpCanvasLayout;
};

export function PdpCanvas({
  layout,
  points,
  productName,
  brandName,
  coverTitle,
  coverSubtitle,
  country,
  language,
  imageUrlByBlockId,
  selectedBlockId,
  zoom,
  onLayoutChange,
  onSelectBlock,
  onDragEnd,
  onRequestImage
}: PdpCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef(new Map<string, HTMLImageElement>());
  const dragRef = useRef<DragState | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState("");
  const [imageRevision, setImageRevision] = useState(0);

  const imageSourceKey = useMemo(() => {
    const entries: Array<[string, string | undefined]> = [
      ["pdp-brand", PDP_BRAND_IMAGE_URL],
      ...Object.entries(imageUrlByBlockId)
    ];
    return entries
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([blockId, url]) => `${blockId}:${url}`)
      .join("|");
  }, [imageUrlByBlockId]);

  useEffect(() => {
    const urls = imageSourceKey
      .split("|")
      .map((entry) => entry.slice(entry.indexOf(":") + 1))
      .filter(Boolean);

    for (const url of urls) {
      if (imageCacheRef.current.has(url)) {
        continue;
      }
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        imageCacheRef.current.set(url, image);
        setImageRevision((current) => current + 1);
      };
      image.onerror = () => {
        imageCacheRef.current.delete(url);
      };
      image.src = url;
      imageCacheRef.current.set(url, image);
    }
  }, [imageSourceKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d");
    } catch {
      return;
    }
    if (!context) {
      return;
    }

    drawPdpCanvas(context, {
      layout,
      points,
      productName,
      brandName,
      coverTitle,
      coverSubtitle,
      country,
      language,
      imageUrlByBlockId,
      selectedBlockId,
      draggingBlockId,
      imageCache: imageCacheRef.current
    });
  }, [
    brandName,
    coverTitle,
    coverSubtitle,
    country,
    draggingBlockId,
    imageRevision,
    imageUrlByBlockId,
    language,
    layout,
    points,
    productName,
    selectedBlockId
  ]);

  function canvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * layout.width,
      y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * layout.height
    };
  }

  function startDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) {
      return;
    }

    const point = canvasPoint(event);
    const block = hitTest(layout.blocks, point.x, point.y, selectedBlockId);
    if (!block) {
      return;
    }

    onSelectBlock(block.id);
    dragRef.current = {
      pointerId: event.pointerId,
      blockId: block.id,
      offsetX: point.x - block.x,
      offsetY: point.y - block.y,
      latestLayout: layout
    };
    setDraggingBlockId(block.id);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function continueDrag(event: PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const point = canvasPoint(event);
    const next = movePdpCanvasBlock(
      layout,
      drag.blockId,
      point.x - drag.offsetX,
      point.y - drag.offsetY
    );
    drag.latestLayout = next;
    onLayoutChange(next);
  }

  function finishDrag(event: PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
    setDraggingBlockId("");
    onDragEnd(drag.latestLayout);
  }

  function openImageSlot(event: PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(event);
    const block = hitTest(layout.blocks, point.x, point.y, selectedBlockId);
    if (!block) {
      return;
    }

    onSelectBlock(block.id);
    if (block.kind === "kv" || block.kind === "selling-point") {
      onRequestImage(block.id);
    }
  }

  function moveSelectedWithKeyboard(event: KeyboardEvent<HTMLCanvasElement>) {
    const block = layout.blocks.find((item) => item.id === selectedBlockId);
    if (!block) {
      return;
    }

    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[event.key];

    if (!direction) {
      if (event.key === "Enter" && (block.kind === "kv" || block.kind === "selling-point")) {
        onRequestImage(block.id);
        event.preventDefault();
      }
      return;
    }

    const step = event.shiftKey ? 1 : 8;
    const next = movePdpCanvasBlock(
      layout,
      block.id,
      block.x + direction[0] * step,
      block.y + direction[1] * step
    );
    onLayoutChange(next);
    onDragEnd(next);
    event.preventDefault();
  }

  return (
    <div className={styles.canvasViewport} data-testid="pdp-canvas-viewport">
      <canvas
        aria-label={`PDP Canvas，包含 ${layout.blocks.length} 个可移动内容块`}
        className={styles.canvas}
        data-testid="pdp-canvas"
        height={layout.height}
        onDoubleClick={openImageSlot}
        onKeyDown={moveSelectedWithKeyboard}
        onPointerCancel={finishDrag}
        onPointerDown={startDrag}
        onPointerMove={continueDrag}
        onPointerUp={finishDrag}
        ref={canvasRef}
        role="application"
        style={{
          cursor: draggingBlockId ? "grabbing" : "grab",
          height: layout.height * zoom,
          width: layout.width * zoom
        }}
        tabIndex={0}
        width={layout.width}
      >
        PDP Canvas
      </canvas>
    </div>
  );
}

type DrawOptions = Omit<
  PdpCanvasProps,
  "zoom" | "onLayoutChange" | "onSelectBlock" | "onDragEnd" | "onRequestImage"
> & {
  draggingBlockId: string;
  imageCache: Map<string, HTMLImageElement>;
};

function drawPdpCanvas(context: CanvasRenderingContext2D, options: DrawOptions) {
  const {
    layout,
    points,
    productName,
    brandName,
    coverTitle,
    coverSubtitle,
    country,
    language,
    imageUrlByBlockId,
    selectedBlockId,
    draggingBlockId,
    imageCache
  } = options;

  context.clearRect(0, 0, layout.width, layout.height);
  context.fillStyle = "#f2f4f7";
  context.fillRect(0, 0, layout.width, layout.height);
  drawGrid(context, layout.width, layout.height);

  const headerBlocks = uniqueColumnHeaders(layout.blocks);
  context.textBaseline = "alphabetic";
  for (const block of headerBlocks) {
    context.fillStyle = block.kind === "selling-point" ? "#087f8c" : "#5f6c7b";
    context.font = "700 13px Segoe UI, Arial, sans-serif";
    context.fillText(getPdpCanvasColumnLabel(block), block.x, 38);
    context.fillStyle = "#c8d1da";
    context.fillRect(block.x, 46, block.width, 1);
  }

  const pointById = new Map(points.map((point) => [point.id, point]));
  const drawOrder = layout.blocks
    .filter((block) => block.id !== selectedBlockId)
    .concat(layout.blocks.filter((block) => block.id === selectedBlockId));

  for (const block of drawOrder) {
    const selected = block.id === selectedBlockId;
    const imageUrl = imageUrlByBlockId[block.id];
    const image = imageUrl ? imageCache.get(imageUrl) : undefined;

    context.save();
    context.shadowColor = selected ? "rgba(0, 166, 214, 0.24)" : "rgba(23, 32, 42, 0.10)";
    context.shadowBlur = selected ? 14 : 8;
    context.shadowOffsetY = selected ? 4 : 3;

    if (block.kind === "brand") {
      drawBrandBlock(context, block, imageCache.get(PDP_BRAND_IMAGE_URL));
    } else if (block.kind === "kv") {
      drawKvBlock(context, block, image, coverTitle, coverSubtitle);
    } else if (block.kind === "selling-point") {
      const point = block.sellingPointId ? pointById.get(block.sellingPointId) : undefined;
      drawSellingPointBlock(context, block, point, image);
    } else if (block.kind === "features") {
      drawFeaturesBlock(context, block, points);
    } else {
      drawSpecificationBlock(context, block, points);
    }
    context.restore();

    if (selected) {
      context.save();
      context.strokeStyle = "#00a6d6";
      context.lineWidth = 4;
      context.strokeRect(block.x - 2, block.y - 2, block.width + 4, block.height + 4);
      context.restore();
    }

    if (block.id === draggingBlockId) {
      context.save();
      context.strokeStyle = "#087f8c";
      context.setLineDash([8, 6]);
      context.lineWidth = 2;
      context.strokeRect(block.x - 7, block.y - 7, block.width + 14, block.height + 14);
      context.restore();
    }
  }

  context.fillStyle = "#5f6c7b";
  context.font = "12px Segoe UI, Arial, sans-serif";
  context.fillText(
    `${productName} · ${country} / ${language} · PDP Canvas`,
    40,
    layout.height - 22
  );
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.strokeStyle = "#e4e9ee";
  context.lineWidth = 1;
  for (let x = 16; x < width; x += 24) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 16; y < height; y += 24) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

function drawBrandBlock(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  image: HTMLImageElement | undefined
) {
  drawBlockBase(context, block, "#ffffff");
  if (image?.complete && image.naturalWidth > 0) {
    const scale = Math.min(block.width / image.naturalWidth, block.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(
      image,
      block.x + (block.width - width) / 2,
      block.y + (block.height - height) / 2,
      width,
      height
    );
  }
}

function drawKvBlock(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  image: HTMLImageElement | undefined,
  coverTitle: string,
  coverSubtitle: string
) {
  drawBlockBase(context, block, "#d9dde3");
  const titleHeight = 58;
  const subtitleHeight = 48;
  const imageHeight = block.height - titleHeight - subtitleHeight;
  drawImageArea(context, image, block.x, block.y, block.width, imageHeight, "KV");

  context.fillStyle = "#bcc2c8";
  context.fillRect(block.x, block.y + imageHeight, block.width, titleHeight);
  drawCenteredWrappedText(
    context,
    coverTitle || "Product key visual",
    block.x + 16,
    block.y + imageHeight,
    block.width - 32,
    titleHeight,
    18,
    2,
    "#26323c",
    "800 16px Segoe UI, Arial, sans-serif"
  );

  context.fillStyle = "#d9dde3";
  context.fillRect(block.x, block.y + imageHeight + titleHeight, block.width, subtitleHeight);
  drawCenteredWrappedText(
    context,
    coverSubtitle || "Product overview",
    block.x + 16,
    block.y + imageHeight + titleHeight,
    block.width - 32,
    subtitleHeight,
    14,
    2,
    "#4d5964",
    "500 11px Segoe UI, Arial, sans-serif"
  );
}

function drawSellingPointBlock(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  point: SellingPoint | undefined,
  image: HTMLImageElement | undefined
) {
  if ((block.level ?? 1) >= 3) {
    drawWideSellingPointBlock(context, block, point, image);
    return;
  }

  drawBlockBase(context, block, "#d9dde3");
  const titleHeight = clamp(Math.round(block.height * 0.21), 34, 54);
  const descriptionHeight = clamp(Math.round(block.height * 0.19), 32, 50);
  const imageHeight = Math.max(42, block.height - titleHeight - descriptionHeight);
  const fontSize = clamp(Math.round(block.width / 18), 11, 16);

  context.fillStyle = "#bcc2c8";
  context.fillRect(block.x, block.y, block.width, titleHeight);
  drawCenteredWrappedText(
    context,
    point?.title || "Selling point",
    block.x + 12,
    block.y,
    block.width - 24,
    titleHeight,
    fontSize + 3,
    2,
    "#26323c",
    `800 ${fontSize}px Segoe UI, Arial, sans-serif`
  );

  context.fillStyle = "#d9dde3";
  context.fillRect(block.x, block.y + titleHeight, block.width, descriptionHeight);
  drawCenteredWrappedText(
    context,
    point?.benefit || "Feature detail",
    block.x + 12,
    block.y + titleHeight,
    block.width - 24,
    descriptionHeight,
    13,
    3,
    "#4d5964",
    "500 11px Segoe UI, Arial, sans-serif"
  );

  context.fillStyle = "#66717b";
  context.font = "700 9px Segoe UI, Arial, sans-serif";
  context.textAlign = "right";
  context.fillText(
    `P${point?.priority ?? block.priority ?? 1}`,
    block.x + block.width - 8,
    block.y + 13
  );
  context.textAlign = "left";

  drawImageArea(
    context,
    image,
    block.x,
    block.y + titleHeight + descriptionHeight,
    block.width,
    imageHeight,
    "IMAGE"
  );
}

function drawWideSellingPointBlock(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  point: SellingPoint | undefined,
  image: HTMLImageElement | undefined
) {
  drawBlockBase(context, block, "#d9dde3");
  const imageOnLeft = (point?.priority ?? block.priority ?? 1) % 2 === 1;
  const imageWidth = Math.round(block.width / 2);
  const textWidth = block.width - imageWidth;
  const imageX = imageOnLeft ? block.x : block.x + textWidth;
  const textX = imageOnLeft ? block.x + imageWidth : block.x;
  const titleHeight = Math.round(block.height * 0.43);

  drawImageArea(context, image, imageX, block.y, imageWidth, block.height, "IMAGE");
  context.fillStyle = "#bcc2c8";
  context.fillRect(textX, block.y, textWidth, titleHeight);
  drawCenteredWrappedText(
    context,
    point?.title || "Selling point",
    textX + 10,
    block.y,
    textWidth - 20,
    titleHeight,
    13,
    2,
    "#26323c",
    "800 11px Segoe UI, Arial, sans-serif"
  );
  context.fillStyle = "#d9dde3";
  context.fillRect(textX, block.y + titleHeight, textWidth, block.height - titleHeight);
  drawCenteredWrappedText(
    context,
    point?.benefit || "Feature detail",
    textX + 10,
    block.y + titleHeight,
    textWidth - 20,
    block.height - titleHeight,
    12,
    3,
    "#4d5964",
    "500 9px Segoe UI, Arial, sans-serif"
  );
}

function drawFeaturesBlock(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  points: SellingPoint[]
) {
  drawBlockBase(context, block, "#eef0f2");
  const headerHeight = 44;
  context.fillStyle = "#bcc2c8";
  context.fillRect(block.x, block.y, block.width, headerHeight);
  context.fillStyle = "#26323c";
  context.font = "700 13px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("More Features", block.x + block.width / 2, block.y + 28);
  context.textAlign = "left";

  const active = points
    .filter((point) => point.enabled !== false)
    .slice().sort((left, right) => left.priority - right.priority);
  const columns = 3;
  const cellWidth = block.width / columns;
  const rowHeight = 86;
  active.forEach((point, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const centerX = block.x + column * cellWidth + cellWidth / 2;
    const centerY = block.y + headerHeight + 32 + row * rowHeight;
    if (centerY + 36 > block.y + block.height) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.strokeStyle = "#9aa7b4";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(centerX, centerY, 18, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#057ca2";
    context.font = "800 10px Segoe UI, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(String(index + 1), centerX, centerY + 4);
    context.textAlign = "left";

    drawWrappedText(
      context,
      point.title,
      centerX - cellWidth / 2 + 4,
      centerY + 25,
      cellWidth - 8,
      10,
      2,
      "#3c4b5d",
      "600 8px Segoe UI, Arial, sans-serif",
      "center"
    );
  });
}

function drawSpecificationBlock(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  points: SellingPoint[]
) {
  drawBlockBase(context, block, "#eef0f2");
  const headerHeight = 44;
  context.fillStyle = "#bcc2c8";
  context.fillRect(block.x, block.y, block.width, headerHeight);
  context.fillStyle = "#26323c";
  context.font = "700 13px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("Specification", block.x + block.width / 2, block.y + 28);
  context.textAlign = "left";

  const active = points
    .filter((point) => point.enabled !== false)
    .slice().sort((left, right) => left.priority - right.priority);
  const rowHeight = Math.min(42, Math.max(28, (block.height - headerHeight - 12) / Math.max(active.length, 1)));
  active.forEach((point, index) => {
    const y = block.y + headerHeight + index * rowHeight;
    if (y + rowHeight > block.y + block.height) {
      return;
    }

    context.fillStyle = index % 2 === 0 ? "#ffffff" : "#eef1f4";
    context.fillRect(block.x, y, block.width, rowHeight);
    context.strokeStyle = "#d9dde3";
    context.strokeRect(block.x, y, block.width, rowHeight);
    context.fillStyle = "#17202a";
    context.font = "700 8px Segoe UI, Arial, sans-serif";
    context.fillText(
      truncate(point.title, 18),
      block.x + 8,
      y + rowHeight / 2 + 3
    );
    context.fillStyle = "#5f6c7b";
    context.font = "8px Segoe UI, Arial, sans-serif";
    context.fillText(
      truncate(point.benefit, 20),
      block.x + block.width * 0.48,
      y + rowHeight / 2 + 3
    );
  });
}

function drawBlockBase(
  context: CanvasRenderingContext2D,
  block: PdpCanvasBlock,
  fill: string
) {
  context.fillStyle = fill;
  context.strokeStyle = "#cfd7df";
  context.lineWidth = 1;
  context.fillRect(block.x, block.y, block.width, block.height);
  context.strokeRect(block.x, block.y, block.width, block.height);
}

function drawImageArea(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string
) {
  context.fillStyle = "#d9dde3";
  context.fillRect(x, y, width, height);
  if (image?.complete && image.naturalWidth > 0) {
    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(
      image,
      x + (width - drawWidth) / 2,
      y + (height - drawHeight) / 2,
      drawWidth,
      drawHeight
    );
    context.restore();
    return;
  }

  context.fillStyle = "#d9dde3";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#b9c4ce";
  context.lineWidth = 1;
  context.strokeRect(x + width / 2 - 17, y + height / 2 - 14, 34, 28);
  context.beginPath();
  context.moveTo(x + width / 2 - 13, y + height / 2 + 9);
  context.lineTo(x + width / 2 - 2, y + height / 2 - 2);
  context.lineTo(x + width / 2 + 5, y + height / 2 + 5);
  context.lineTo(x + width / 2 + 13, y + height / 2 - 5);
  context.stroke();
  context.fillStyle = "#7d8a98";
  context.font = "700 9px Segoe UI, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(label, x + width / 2, y + height / 2 + 30);
  context.textAlign = "left";
}

function drawCenteredWrappedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  lineHeight: number,
  maxLines: number,
  color: string,
  font: string
) {
  context.save();
  context.fillStyle = color;
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = wrapCanvasText(context, value, width, maxLines);
  const firstLineY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, x + width / 2, firstLineY + index * lineHeight);
  });
  context.restore();
}
function drawWrappedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  color: string,
  font: string,
  align: CanvasTextAlign = "left"
) {
  context.fillStyle = color;
  context.font = font;
  context.textAlign = align;
  const lines = wrapCanvasText(context, value, maxWidth, maxLines);
  const drawX = align === "center" ? x + maxWidth / 2 : x;
  lines.forEach((line, index) => {
    context.fillText(line, drawX, y + (index + 1) * lineHeight);
  });
  context.textAlign = "left";
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const clean = value.trim();
  if (!clean) {
    return [""];
  }

  const tokens = clean.includes(" ") ? clean.split(/\s+/) : Array.from(clean);
  const joiner = clean.includes(" ") ? " " : "";
  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const next = current ? `${current}${joiner}${token}` : token;
    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = token;
      if (lines.length === maxLines) {
        break;
      }
    } else {
      current = next;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length === maxLines) {
    const consumed = lines.join(joiner).length;
    if (consumed < clean.length) {
      let last = lines[maxLines - 1];
      while (last.length > 1 && context.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }

  return lines;
}

function uniqueColumnHeaders(blocks: PdpCanvasBlock[]): PdpCanvasBlock[] {
  const seen = new Set<string>();
  return blocks
    .slice()
    .sort((left, right) => left.x - right.x || left.y - right.y)
    .filter((block) => {
      const key = block.kind === "selling-point" ? `sp-${block.level ?? 1}` : block.kind;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function hitTest(
  blocks: PdpCanvasBlock[],
  x: number,
  y: number,
  selectedBlockId: string
): PdpCanvasBlock | undefined {
  const selected = blocks.find((block) => block.id === selectedBlockId);
  if (selected && containsPoint(selected, x, y)) {
    return selected;
  }

  return blocks
    .slice()
    .reverse()
    .find((block) => containsPoint(block, x, y));
}

function containsPoint(block: PdpCanvasBlock, x: number, y: number): boolean {
  return (
    x >= block.x &&
    x <= block.x + block.width &&
    y >= block.y &&
    y <= block.y + block.height
  );
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
