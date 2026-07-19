import type { AssetType } from "./types";

/**
 * The four intake material groups required by the platform:
 * product info, brand guidelines, template materials, and sample assets.
 * They drive every downstream generation feature.
 */
export type MaterialCategoryKey = "product-info" | "brand-spec" | "template" | "sample";

export type MaterialCategory = {
  key: MaterialCategoryKey;
  label: string;
  description: string;
  assetTypes: AssetType[];
  /** The default AssetType applied when uploading into this category. */
  defaultAssetType: AssetType;
  accept: string;
};

export const materialCategories: MaterialCategory[] = [
  {
    key: "product-info",
    label: "产品信息",
    description: "产品资料、卖点清单(txt/json/pdf)。用于识别卖点,驱动 PDP 与生成提示词。",
    assetTypes: ["document"],
    defaultAssetType: "document",
    accept: ".txt,.json,.md,.pdf",
  },
  {
    key: "brand-spec",
    label: "品牌规范",
    description: "品牌 VI、Logo 用法、色彩规范。生成时用于品牌约束。",
    assetTypes: ["brand-guide", "icon-vi-color"],
    defaultAssetType: "brand-guide",
    accept: "image/*,.pdf"
  },
  {
    key: "template",
    label: "模板资料",
    description: "POP / PDP 模板样式参考。用于模板对齐与扩展。",
    assetTypes: ["template-reference", "icon-vi-style"],
    defaultAssetType: "template-reference",
    accept: "image/*,.pdf"
  },
  {
    key: "sample",
    label: "样例素材",
    description: "产品照片、手机实拍、图标、背景等。作为图像生成的参考图和模板配图。",
    assetTypes: ["product-photo", "phone-shot", "feature-icon", "background", "pop-input", "pdp-input", "sku-product", "sku-reference-part", "icon-source"],
    defaultAssetType: "product-photo",
    accept: "image/*"
  }
];

export function getMaterialCategory(key: string): MaterialCategory {
  const category = materialCategories.find((item) => item.key === key);
  if (!category) {
    throw new Error(`Unknown material category: ${key}`);
  }
  return category;
}

export function getMaterialCategoryForAssetType(type: AssetType): MaterialCategory | undefined {
  return materialCategories.find((category) => category.assetTypes.includes(type));
}
