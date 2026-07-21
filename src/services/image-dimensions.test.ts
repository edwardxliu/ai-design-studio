import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  chooseImageProviderSize,
  readImageDimensions,
  resizeImageToExactDimensions
} from "./image-dimensions";

describe("image dimensions", () => {
  it("chooses the provider canvas from the original aspect ratio", () => {
    expect(chooseImageProviderSize({ width: 1600, height: 900 })).toBe("1536x1024");
    expect(chooseImageProviderSize({ width: 900, height: 1600 })).toBe("1024x1536");
    expect(chooseImageProviderSize({ width: 1200, height: 1200 })).toBe("1024x1024");
  });

  it("reads SVG dimensions and restores generated pixels to the exact source size", async () => {
    const source = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"></svg>',
      "utf8"
    );
    expect(await readImageDimensions(source)).toEqual({ width: 1200, height: 600 });

    const generated = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 40, g: 80, b: 120, alpha: 1 }
      }
    })
      .png()
      .toBuffer();
    const resized = await resizeImageToExactDimensions(generated, { width: 1200, height: 600 });
    expect(await readImageDimensions(resized)).toEqual({ width: 1200, height: 600 });
  });
});