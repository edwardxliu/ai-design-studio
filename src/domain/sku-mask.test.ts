import { describe, expect, it } from "vitest";
import {
  createEditableMask,
  floodSelectRegion,
  getAspectConstrainedWidth,
  hasMaskSelection,
  paintMaskCircle
} from "./sku-mask";

describe("SKU editable mask", () => {
  it("preserves the source ratio when the canvas is constrained by height", () => {
    const maximumWidth = getAspectConstrainedWidth(355, 334, 680);
    expect(maximumWidth).toBe(723);
    expect(maximumWidth / 680).toBeCloseTo(355 / 334, 3);
  });

  it("paints and erases circular selections", () => {
    const empty = createEditableMask(7, 7);
    const painted = paintMaskCircle(empty, 3, 3, 2, true);
    expect(hasMaskSelection(painted)).toBe(true);
    expect(painted.values[3 * 7 + 3]).toBe(255);
    const erased = paintMaskCircle(painted, 3, 3, 2, false);
    expect(hasMaskSelection(erased)).toBe(false);
  });

  it("selects only a contiguous color region from the clicked pixel", () => {
    const mask = createEditableMask(4, 2);
    const pixels = new Uint8ClampedArray([
      20, 20, 20, 255, 22, 21, 20, 255, 220, 220, 220, 255, 221, 221, 221, 255,
      20, 19, 20, 255, 23, 22, 21, 255, 219, 220, 220, 255, 220, 219, 220, 255
    ]);
    const selected = floodSelectRegion(mask, pixels, 0, 0, 10);
    expect(Array.from(selected.values)).toEqual([255, 255, 0, 0, 255, 255, 0, 0]);
  });

  it("rejects source pixels whose dimensions do not match the mask", () => {
    expect(() => floodSelectRegion(createEditableMask(2, 2), new Uint8ClampedArray(4), 0, 0, 10))
      .toThrow("尺寸与选区蒙版不一致");
  });
});