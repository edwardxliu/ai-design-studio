import { describe, expect, it } from "vitest";
import { buildSkuReplacementPrompt } from "./sku-replacement";

describe("SKU replacement prompts", () => {
  it("keeps image order explicit for reference-part replacement", () => {
    const prompt = buildSkuReplacementPrompt({
      mode: "reference-part",
      instruction: "把顶部控制面板替换成新面板。"
    });
    expect(prompt).toContain("image 1");
    expect(prompt).toContain("image 2");
    expect(prompt).toContain("只替换用户指定的局部");
    expect(prompt).toContain("不得把 image 2 的背景带入");
  });

  it("limits color edits to the mask and explains the Doubao mask reference", () => {
    const prompt = buildSkuReplacementPrompt({
      mode: "color",
      instruction: "改成暖铜色玫瑰金。",
      selectionDescription: "金属包边和把手",
      maskAsReference: true
    });
    expect(prompt).toContain("金属包边和把手");
    expect(prompt).toContain("透明区域是允许编辑区");
    expect(prompt).toContain("蒙版外");
    expect(prompt).toContain("颜色与材质");
  });

  it("rejects an empty local-edit instruction", () => {
    expect(() => buildSkuReplacementPrompt({ mode: "style", instruction: "  " }))
      .toThrow("请填写局部替换要求");
  });
});