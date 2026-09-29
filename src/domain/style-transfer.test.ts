import { describe, expect, it } from "vitest";
import {
  STYLE_TRANSFER_PRESETS,
  STYLE_TRANSFER_VARIANTS,
  buildStyleTransferPrompt,
  getStyleTransferPreset,
  matchStyleTransferPreset
} from "./style-transfer";

describe("style transfer domain", () => {
  it("exposes six PPT-derived image styles and three static outputs", () => {
    expect(STYLE_TRANSFER_PRESETS).toHaveLength(6);
    expect(STYLE_TRANSFER_VARIANTS).toHaveLength(3);
    expect(STYLE_TRANSFER_PRESETS.map((preset) => preset.label)).toEqual([
      "拉美热带美学",
      "银色旗舰",
      "国际化现代高端",
      "时尚杂志式家电",
      "北欧Hygge风格",
      "日式美学风格"
    ]);
    expect(STYLE_TRANSFER_PRESETS.every((preset) => preset.references.length >= 2)).toBe(true);
    expect(getStyleTransferPreset("lab").references[0].url).toBe("/style-references/lab/ref-1.png");
    expect(getStyleTransferPreset("nordic-home").references).toHaveLength(3);
    expect(getStyleTransferPreset("japanese-aesthetic").references).toHaveLength(4);
  });

  it("matches user keywords to the closest style", () => {
    expect(matchStyleTransferPreset("石墨灰 黑色金属 建筑实验室").id).toBe("lab");
    expect(matchStyleTransferPreset("丹麦住宅 浅橡木 冬季雪景").id).toBe("nordic-home");
    expect(matchStyleTransferPreset("暖木 障子 庭院 日式美学").id).toBe("japanese-aesthetic");
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
