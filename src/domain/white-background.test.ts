import { describe, expect, it } from "vitest";
import {
  buildWhiteBackgroundPrompt,
  WHITE_BACKGROUND_ANGLES,
  WHITE_BACKGROUND_SOURCE_TYPES
} from "./white-background";

describe("white-background generation rules", () => {
  it("defines three catalog angles for every supplied source image", () => {
    expect(WHITE_BACKGROUND_ANGLES.map((angle) => angle.id)).toEqual([
      "left-45",
      "front",
      "right-45"
    ]);
  });

  it("keeps closed-door inputs closed and produces one angle per output", () => {
    const prompt = buildWhiteBackgroundPrompt("closed", "left-45");

    expect(prompt).toContain("全部门体处于关闭状态");
    expect(prompt).toContain("左侧 45°");
    expect(prompt).toContain("不要拼接多个视角");
    expect(prompt).toContain("严格保持产品几何结构、比例尺寸、材质、颜色、Logo 位置");
    expect(prompt).toContain("纯白无缝背景（#FFFFFF）");
  });

  it("keeps open-door geometry and internal structure unchanged", () => {
    const prompt = buildWhiteBackgroundPrompt("open", "right-45");

    expect(prompt).toContain("门体开启角度、内部结构和所有可见部件完全一致");
    expect(prompt).toContain("右侧 45°");
    expect(prompt).toContain("Catalog");
  });

  it("uses dedicated asset types for the two fixed upload slots", () => {
    expect(WHITE_BACKGROUND_SOURCE_TYPES).toEqual({
      closed: "white-background-closed",
      open: "white-background-open"
    });
  });
});
