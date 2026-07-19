import { describe, expect, it } from "vitest";
import {
  buildPhoneStandardizationPrompt,
  PHONE_STANDARDIZATION_ANGLES
} from "./phone-standardization";

describe("phone standardization generation rules", () => {
  it("defines the three required independent studio angles", () => {
    expect(PHONE_STANDARDIZATION_ANGLES.map((angle) => angle.id)).toEqual([
      "studio-left-45",
      "studio-front",
      "studio-right-45"
    ]);
  });

  it("removes scene interference while preserving native product structure", () => {
    const prompt = buildPhoneStandardizationPrompt("studio-front");

    expect(prompt).toContain("正视");
    expect(prompt).toContain("环境倒影、杂乱反射、有色光照和色偏");
    expect(prompt).toContain("贴纸、价签、宣传物料");
    expect(prompt).toContain("不得删除产品原生 Logo、控制面板、把手、门体");
    expect(prompt).toContain("同一个三维产品模型的多视角重建");
    expect(prompt).toContain("纯白无缝背景（#FFFFFF）");
    expect(prompt).toContain("Catalog");
    expect(prompt).toContain("不要拼接多个视角");
  });

  it("builds a distinct camera instruction for every output", () => {
    for (const angle of PHONE_STANDARDIZATION_ANGLES) {
      const prompt = buildPhoneStandardizationPrompt(angle.id);
      expect(prompt).toContain(angle.label);
      expect(prompt).toContain(angle.instruction);
    }
  });
});