import { describe, expect, it } from "vitest";
import {
  getMaterialCategory,
  getMaterialCategoryForAssetType,
  materialCategories
} from "./material-categories";

describe("material categories", () => {
  it("covers the four required intake groups", () => {
    expect(materialCategories.map((category) => category.label)).toEqual([
      "产品信息",
      "品牌规范",
      "模板资料",
      "样例素材"
    ]);
  });

  it("maps every asset type in a category back to that category", () => {
    for (const category of materialCategories) {
      for (const type of category.assetTypes) {
        expect(getMaterialCategoryForAssetType(type)?.key).toBe(category.key);
      }
    }
  });

  it("throws for unknown category keys", () => {
    expect(() => getMaterialCategory("nope")).toThrow("Unknown material category");
  });
});
