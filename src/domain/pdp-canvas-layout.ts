import type { SellingPoint } from "./types";

export type PdpCanvasBlockKind =
  | "brand"
  | "kv"
  | "selling-point"
  | "features"
  | "specification";

export type PdpCanvasBlock = {
  id: string;
  kind: PdpCanvasBlockKind;
  x: number;
  y: number;
  width: number;
  height: number;
  level?: number;
  priority?: number;
  sellingPointId?: string;
};

export type PdpCanvasLayout = {
  width: number;
  height: number;
  blocks: PdpCanvasBlock[];
};

export const PDP_CANVAS_PADDING = 40;
export const PDP_CANVAS_TOP = 62;
export const PDP_CANVAS_ROW_GAP = 16;
export const PDP_CANVAS_COLUMN_GAP = 26;
export const PDP_CANVAS_TREE_HEIGHT = 560;
export const PDP_BRAND_ASPECT_RATIO = 875 / 941;
export const PDP_BRAND_BLOCK_WIDTH = 300;
export const PDP_BRAND_BLOCK_HEIGHT = Math.round(
  PDP_BRAND_BLOCK_WIDTH * (941 / 875)
);
export const PDP_WIDE_SELLING_POINT_WIDTH = 304;

export const PDP_BRAND_BLOCK_ID = "pdp-block-brand";
export const PDP_KV_BLOCK_ID = "pdp-block-kv";
export const PDP_FEATURES_BLOCK_ID = "pdp-block-features";
export const PDP_SPECIFICATION_BLOCK_ID = "pdp-block-specification";

export function getSellingPointBlockId(sellingPointId: string): string {
  return `pdp-block-sp-${sellingPointId}`;
}

export function buildDefaultPdpCanvasLayout(
  sellingPoints: Array<Pick<SellingPoint, "id" | "priority" | "enabled">>
): PdpCanvasLayout {
  const selected = sellingPoints
    .filter((point) => point.enabled !== false)
    .slice()
    .sort((left, right) => left.priority - right.priority);

  const blocks: PdpCanvasBlock[] = [];
  let x = PDP_CANVAS_PADDING;

  blocks.push({
    id: PDP_BRAND_BLOCK_ID,
    kind: "brand",
    x,
    y: PDP_CANVAS_TOP,
    width: PDP_BRAND_BLOCK_WIDTH,
    height: PDP_BRAND_BLOCK_HEIGHT
  });
  x += PDP_BRAND_BLOCK_WIDTH + PDP_CANVAS_COLUMN_GAP;

  blocks.push({
    id: PDP_KV_BLOCK_ID,
    kind: "kv",
    x,
    y: PDP_CANVAS_TOP,
    width: 320,
    height: PDP_CANVAS_TREE_HEIGHT
  });
  x += 320 + PDP_CANVAS_COLUMN_GAP;

  let pointIndex = 0;
  let level = 1;

  while (pointIndex < selected.length) {
    const capacity = level + 1;
    const columnPoints = selected.slice(pointIndex, pointIndex + capacity);
    const width =
      level >= 3 ? PDP_WIDE_SELLING_POINT_WIDTH : 292 - (level - 1) * 36;
    const rowGap = level >= 3 ? 4 : PDP_CANVAS_ROW_GAP;
    const height = Math.max(
      112,
      Math.floor(
        (PDP_CANVAS_TREE_HEIGHT - (capacity - 1) * rowGap) / capacity
      )
    );

    columnPoints.forEach((point, slotIndex) => {
      blocks.push({
        id: getSellingPointBlockId(point.id),
        kind: "selling-point",
        sellingPointId: point.id,
        priority: pointIndex + slotIndex + 1,
        level,
        x,
        y: PDP_CANVAS_TOP + slotIndex * (height + rowGap),
        width,
        height
      });
    });

    pointIndex += columnPoints.length;
    x += width + PDP_CANVAS_COLUMN_GAP;
    level += 1;
  }

  blocks.push({
    id: PDP_FEATURES_BLOCK_ID,
    kind: "features",
    x,
    y: PDP_CANVAS_TOP,
    width: 228,
    height: 480
  });
  x += 228 + PDP_CANVAS_COLUMN_GAP;

  blocks.push({
    id: PDP_SPECIFICATION_BLOCK_ID,
    kind: "specification",
    x,
    y: PDP_CANVAS_TOP,
    width: 250,
    height: 480
  });
  x += 250;

  const contentBottom = Math.max(
    ...blocks.map((block) => block.y + block.height),
    PDP_CANVAS_TOP + PDP_CANVAS_TREE_HEIGHT
  );

  return {
    width: x + PDP_CANVAS_PADDING,
    height: contentBottom + 58,
    blocks
  };
}

export function rankSellingPointIds(layout: PdpCanvasLayout): string[] {
  const blocks = layout.blocks
    .filter(
      (block): block is PdpCanvasBlock & { sellingPointId: string } =>
        block.kind === "selling-point" && Boolean(block.sellingPointId)
    )
    .slice()
    .sort((left, right) => left.x - right.x);
  const columns: Array<{
    anchorX: number;
    minimumWidth: number;
    blocks: Array<PdpCanvasBlock & { sellingPointId: string }>;
  }> = [];

  for (const block of blocks) {
    const column = columns.find(
      (candidate) =>
        Math.abs(candidate.anchorX - block.x) <=
        Math.min(candidate.minimumWidth, block.width) * 0.4
    );
    if (column) {
      column.blocks.push(block);
      column.anchorX =
        column.blocks.reduce((sum, item) => sum + item.x, 0) / column.blocks.length;
      column.minimumWidth = Math.min(column.minimumWidth, block.width);
    } else {
      columns.push({ anchorX: block.x, minimumWidth: block.width, blocks: [block] });
    }
  }

  return columns
    .sort((left, right) => left.anchorX - right.anchorX)
    .flatMap((column) => column.blocks.sort((left, right) => left.y - right.y))
    .map((block) => block.sellingPointId);
}

export function movePdpCanvasBlock(
  layout: PdpCanvasLayout,
  blockId: string,
  x: number,
  y: number
): PdpCanvasLayout {
  return {
    ...layout,
    blocks: layout.blocks.map((block) => {
      if (block.id !== blockId) {
        return block;
      }

      return {
        ...block,
        x: clamp(Math.round(x), 12, Math.max(12, layout.width - block.width - 12)),
        y: clamp(Math.round(y), 36, Math.max(36, layout.height - block.height - 36))
      };
    })
  };
}

export function getPdpCanvasColumnLabel(block: PdpCanvasBlock): string {
  if (block.kind === "brand") {
    return "Brand";
  }
  if (block.kind === "kv") {
    return "KV";
  }
  if (block.kind === "selling-point") {
    return `SP${block.level ?? 1}`;
  }
  if (block.kind === "features") {
    return "More Features & Icon";
  }
  return "Specification";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}


const canvasBlockKinds = new Set<PdpCanvasBlockKind>([
  "brand",
  "kv",
  "selling-point",
  "features",
  "specification"
]);

export function parsePdpCanvasLayout(value: unknown): PdpCanvasLayout | undefined {
  if (!isRecord(value) || !Array.isArray(value.blocks)) {
    return undefined;
  }

  const width = finiteNumber(value.width);
  const height = finiteNumber(value.height);
  if (width === undefined || height === undefined || width < 320 || width > 20_000 || height < 320 || height > 12_000) {
    return undefined;
  }

  const blocks = value.blocks
    .slice(0, 200)
    .map((item): PdpCanvasBlock | undefined => {
      if (!isRecord(item) || typeof item.id !== "string" || item.id.length > 160) {
        return undefined;
      }
      if (typeof item.kind !== "string" || !canvasBlockKinds.has(item.kind as PdpCanvasBlockKind)) {
        return undefined;
      }

      const x = finiteNumber(item.x);
      const y = finiteNumber(item.y);
      const blockWidth = finiteNumber(item.width);
      const blockHeight = finiteNumber(item.height);
      if (x === undefined || y === undefined || blockWidth === undefined || blockHeight === undefined) {
        return undefined;
      }
      if (blockWidth < 72 || blockWidth > 2_000 || blockHeight < 60 || blockHeight > 4_000) {
        return undefined;
      }

      const block: PdpCanvasBlock = {
        id: item.id,
        kind: item.kind as PdpCanvasBlockKind,
        x: clamp(Math.round(x), 0, Math.max(0, width - blockWidth)),
        y: clamp(Math.round(y), 0, Math.max(0, height - blockHeight)),
        width: Math.round(blockWidth),
        height: Math.round(blockHeight)
      };

      if (typeof item.sellingPointId === "string" && item.sellingPointId.length <= 160) {
        block.sellingPointId = item.sellingPointId;
      }
      const level = finiteNumber(item.level);
      if (level !== undefined) {
        block.level = clamp(Math.round(level), 1, 100);
      }
      const priority = finiteNumber(item.priority);
      if (priority !== undefined) {
        block.priority = clamp(Math.round(priority), 1, 200);
      }
      return block;
    })
    .filter((block): block is PdpCanvasBlock => Boolean(block));

  if (!blocks.some((block) => block.kind === "brand") || !blocks.some((block) => block.kind === "kv")) {
    return undefined;
  }

  return { width: Math.round(width), height: Math.round(height), blocks };
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
