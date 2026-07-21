import { describe, expect, it } from "vitest";
import { computeCoverCropPlacement, parseAspectRatio } from "./image-crop";

describe("computeCoverCropPlacement", () => {
  it("centers and covers a landscape image in a square viewport", () => {
    const placement = computeCoverCropPlacement({
      imageWidth: 1600,
      imageHeight: 900,
      viewportWidth: 600,
      viewportHeight: 600
    });

    expect(placement.height).toBe(600);
    expect(placement.width).toBeGreaterThan(600);
    expect(placement.x).toBeCloseTo((600 - placement.width) / 2);
    expect(placement.y).toBe(0);
  });

  it("allows zooming below the cover scale and keeps the image centered", () => {
    const placement = computeCoverCropPlacement({
      imageWidth: 1600,
      imageHeight: 900,
      viewportWidth: 600,
      viewportHeight: 600,
      zoom: 0.5
    });

    expect(placement.width).toBeLessThan(600);
    expect(placement.height).toBeLessThan(600);
    expect(placement.x).toBeCloseTo((600 - placement.width) / 2);
    expect(placement.y).toBeCloseTo((600 - placement.height) / 2);
  });
  it("supports zoom and normalized panning without exposing empty canvas", () => {
    const placement = computeCoverCropPlacement({
      imageWidth: 1000,
      imageHeight: 1000,
      viewportWidth: 500,
      viewportHeight: 300,
      zoom: 2,
      panX: 1,
      panY: -1
    });

    expect(placement.x).toBe(0);
    expect(placement.y).toBe(-700);
    expect(placement.width).toBe(1000);
    expect(placement.height).toBe(1000);
  });
});

describe("parseAspectRatio", () => {
  it("parses colon and slash formats", () => {
    expect(parseAspectRatio("16:9")).toBeCloseTo(16 / 9);
    expect(parseAspectRatio("4 / 5")).toBeCloseTo(0.8);
  });
});