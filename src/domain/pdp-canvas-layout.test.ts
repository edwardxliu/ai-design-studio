import { describe, expect, it } from "vitest";
import type { SellingPoint } from "./types";
import {
  PDP_CANVAS_TOP,
  PDP_KV_BLOCK_ID,
  buildDefaultPdpCanvasLayout,
  getSellingPointBlockId,
  movePdpCanvasBlock,
  parsePdpCanvasLayout,
  rankSellingPointIds
} from "./pdp-canvas-layout";

function makePoints(count: number): SellingPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `point-${index + 1}`,
    title: `Point ${index + 1}`,
    shortLabel: `P${index + 1}`,
    benefit: `Benefit ${index + 1}`,
    priority: index + 1
  }));
}

describe("buildDefaultPdpCanvasLayout", () => {
  it("creates Brand, KV, then selling-point levels with capacities 2, 3, and 4", () => {
    const layout = buildDefaultPdpCanvasLayout(makePoints(9));
    const sellingBlocks = layout.blocks.filter((block) => block.kind === "selling-point");

    expect(layout.blocks[0].kind).toBe("brand");
    expect(layout.blocks[1].id).toBe(PDP_KV_BLOCK_ID);
    expect(sellingBlocks.filter((block) => block.level === 1)).toHaveLength(2);
    expect(sellingBlocks.filter((block) => block.level === 2)).toHaveLength(3);
    expect(sellingBlocks.filter((block) => block.level === 3)).toHaveLength(4);
  });

  it("top-aligns every priority column and makes later levels smaller", () => {
    const layout = buildDefaultPdpCanvasLayout(makePoints(9));
    const firstByLevel = [1, 2, 3].map((level) =>
      layout.blocks.find(
        (block) => block.kind === "selling-point" && block.level === level
      )
    );

    expect(firstByLevel.every((block) => block?.y === PDP_CANVAS_TOP)).toBe(true);
    expect(firstByLevel[0]!.width).toBeGreaterThan(firstByLevel[1]!.width);
    expect(firstByLevel[1]!.width).toBeGreaterThan(firstByLevel[2]!.width);
    expect(firstByLevel[0]!.height).toBeGreaterThan(firstByLevel[1]!.height);
    expect(firstByLevel[1]!.height).toBeGreaterThan(firstByLevel[2]!.height);
  });

  it("ranks selling points by their visual left-to-right and top-to-bottom position", () => {
    const initial = buildDefaultPdpCanvasLayout(makePoints(4));
    const moved = movePdpCanvasBlock(
      initial,
      getSellingPointBlockId("point-4"),
      20,
      PDP_CANVAS_TOP
    );

    expect(rankSellingPointIds(moved)[0]).toBe("point-4");
  });
});

  it("keeps top-to-bottom priority when a block is nudged inside the same column", () => {
    const initial = buildDefaultPdpCanvasLayout(makePoints(4));
    const first = initial.blocks.find((block) => block.id === getSellingPointBlockId("point-1"))!;
    const nudged = movePdpCanvasBlock(
      initial,
      first.id,
      first.x + 8,
      first.y
    );

    expect(rankSellingPointIds(nudged).slice(0, 2)).toEqual(["point-1", "point-2"]);
  });


describe("parsePdpCanvasLayout", () => {
  it("accepts a valid editor layout and rejects malformed canvas data", () => {
    const valid = buildDefaultPdpCanvasLayout(makePoints(3));

    expect(parsePdpCanvasLayout(valid)?.blocks).toHaveLength(valid.blocks.length);
    expect(parsePdpCanvasLayout({ ...valid, width: Number.NaN })).toBeUndefined();
    expect(parsePdpCanvasLayout({ width: 800, height: 600, blocks: [] })).toBeUndefined();
  });
});
