import { describe, expect, it } from "vitest";
import {
  STYLE_TRANSFER_PRESETS,
  STYLE_TRANSFER_VARIANTS,
  buildStyleTransferPrompt,
  getStyleTransferPreset,
  matchStyleTransferPreset
} from "./style-transfer";

describe("style transfer domain", () => {
  it("exposes seven PPT-derived image styles and three static outputs", () => {
    expect(STYLE_TRANSFER_PRESETS).toHaveLength(7);
    expect(STYLE_TRANSFER_VARIANTS).toHaveLength(3);
    expect(STYLE_TRANSFER_PRESETS.every((preset) => preset.references.length >= 2)).toBe(true);
  });

  it("matches user keywords to the closest style", () => {
    expect(matchStyleTransferPreset("石墨灰 黑色金属 建筑实验室").id).toBe("lab");
    expect(matchStyleTransferPreset("丹麦住宅 浅橡木 冬季雪景").id).toBe("nordic-home");
    expect(matchStyleTransferPreset("纯黑空间 障子 仪式感").id).toBe("japanese-dark");
  });

  it("keeps product and style references separated and excludes video output", () => {
    const prompt = buildStyleTransferPrompt({
      preset: getStyleTransferPreset("latin-american"),
      variantId: "hero-scene",
      keywords: "洞石 胡桃木 自然光",
      productName: "Uploaded appliance"
    });

    expect(prompt).toContain("Image 1 is the only authoritative product reference");
    expect(prompt).toContain("Images 2 and later are style references only");
    expect(prompt).toContain("洞石 胡桃木 自然光");
    expect(prompt).toContain("output exactly one still image");
    expect(prompt).toContain("No video");
  });
});
