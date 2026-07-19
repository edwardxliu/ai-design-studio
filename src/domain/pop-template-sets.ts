import type { ProductWithProfile } from "./types";
import type { PopSlot, PopTemplate } from "./pop";

export type PopProductType = "refrigerator" | "oven";

export type PopCanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PopCanvasVariant = {
  templateId: string;
  label: string;
  bounds: PopCanvasRect;
};

export type PopStickerGroup = {
  id: string;
  name: string;
  bounds: PopCanvasRect;
  variants: PopCanvasVariant[];
};

export type PopTemplateSet = {
  productType: PopProductType;
  name: string;
  canvas: {
    width: number;
    height: number;
  };
  groups: PopStickerGroup[];
};

const imageSlotAssetTypes = [
  "product-photo",
  "phone-shot",
  "feature-icon",
  "background",
  "pop-input"
] as const;

function textSlot(
  id: string,
  label: string,
  _defaultValue: string,
  maxLength: number
): PopSlot {
  const defaultValue = id.toLowerCase().includes("subheading")
    ? "Subheading Space"
    : "Headline Space";
  return { id, type: "text", label, defaultValue, maxLength, editable: true };
}

function imageSlot(id: string, label: string): PopSlot {
  return {
    id,
    type: "image",
    label,
    acceptedAssetTypes: [...imageSlotAssetTypes],
    editable: true
  };
}

export const additionalPopTemplates: PopTemplate[] = [
  {
    id: "main-sticker-usp-footer",
    name: "Main Sticker - USP / Overlay",
    version: "3.0",
    aspectRatio: "4:5",
    placementHints: ["front panel", "door surface", "retail display"],
    slots: [
      imageSlot("uspImage", "USP 主图"),
      textSlot("headline", "主标题", "Headline Space", 28),
      textSlot("subheading", "副标题", "Subheading Space", 44)
    ]
  },
  {
    id: "main-sticker-feature-duo",
    name: "Main Sticker - Feature / Duo",
    version: "3.0",
    aspectRatio: "16:9",
    placementHints: ["front panel", "door surface", "side panel"],
    slots: [
      imageSlot("featureImage1", "特性图 1"),
      textSlot("headline1", "标题 1", "Bigger volume", 22),
      imageSlot("featureImage2", "特性图 2"),
      textSlot("headline2", "标题 2", "Quiet cooling", 22)
    ]
  },
  {
    id: "inner-sticker-display-left",
    name: "Inner Sticker & Display / Left",
    version: "3.0",
    aspectRatio: "16:9",
    placementHints: ["inner panel", "display area", "inside door"],
    slots: [
      imageSlot("featureImage", "特性大图"),
      textSlot("headline", "主标题", "Fresh keeping technology", 28),
      textSlot("subheading", "副标题", "Multi-zone humidity control", 44)
    ]
  },
  {
    id: "inner-sticker-display-right",
    name: "Inner Sticker & Display / Right",
    version: "3.0",
    aspectRatio: "16:9",
    placementHints: ["inner panel", "display area", "inside door"],
    slots: [
      imageSlot("featureImage", "特性大图"),
      textSlot("headline", "主标题", "Fresh keeping technology", 28),
      textSlot("subheading", "副标题", "Multi-zone humidity control", 44)
    ]
  },
  {
    id: "oven-main-hero",
    name: "Main Sticker / Hero",
    version: "3.0",
    aspectRatio: "3:2",
    placementHints: ["oven door", "front glass", "retail display"],
    slots: [
      imageSlot("featureImage", "主视觉"),
      textSlot("headline", "主标题", "Headline Space", 30),
      textSlot("subheading", "副标题", "Subheading Space", 36)
    ]
  },
  {
    id: "oven-main-feature",
    name: "Main Sticker / Feature Grid",
    version: "3.0",
    aspectRatio: "3:2",
    placementHints: ["oven door", "front glass", "retail display"],
    slots: [
      imageSlot("heroImage", "主视觉"),
      textSlot("headline", "主标题", "Headline Space", 28),
      textSlot("subheading", "副标题", "Subheading Space", 36),
      imageSlot("featureImage1", "特性图 1"),
      textSlot("featureText1", "特性文字 1", "Headline Space", 18),
      imageSlot("featureImage2", "特性图 2"),
      textSlot("featureText2", "特性文字 2", "Headline Space", 18),
      imageSlot("featureImage3", "特性图 3"),
      textSlot("featureText3", "特性文字 3", "Headline Space", 18)
    ]
  },
  {
    id: "oven-corner-brand",
    name: "Corner Sticker",
    version: "3.0",
    aspectRatio: "5:3",
    placementHints: ["top corner", "glass corner", "control panel corner"],
    slots: [
      imageSlot("featureImage", "角贴图片"),
      textSlot("headline", "主标题", "Headline Space", 24)
    ]
  },
  {
    id: "oven-inner-display",
    name: "Inner Display",
    version: "3.0",
    aspectRatio: "4:3",
    placementHints: ["inner display", "inside door", "control panel"],
    slots: [
      imageSlot("featureImage", "特性大图"),
      textSlot("headline", "主标题", "Even cooking", 24),
      textSlot("subheading", "副标题", "Consistent heat distribution", 36)
    ]
  },
  {
    id: "oven-wobbler",
    name: "Wobbler",
    version: "3.0",
    aspectRatio: "1:2",
    placementHints: ["door handle", "shelf edge", "retail display"],
    slots: [
      imageSlot("featureImage1", "特性图 1"),
      textSlot("headline1", "标题 1", "Headline Space", 18),
      textSlot("subheading1", "副标题 1", "Subheading Space", 30),
      imageSlot("featureImage2", "特性图 2"),
      textSlot("headline2", "标题 2", "Headline Space", 18),
      textSlot("subheading2", "副标题 2", "Subheading Space", 30)
    ]
  },
  {
    id: "oven-body-round",
    name: "Body Sticker / Round",
    version: "3.0",
    aspectRatio: "1:1",
    placementHints: ["oven body", "door surface", "side panel"],
    slots: [
      imageSlot("featureImage", "圆形特性图"),
      textSlot("headline", "主标题", "Energy saving", 22)
    ]
  },
  {
    id: "oven-body-strip",
    name: "Body Sticker / Strip",
    version: "3.0",
    aspectRatio: "8:1",
    placementHints: ["oven body", "door surface", "side panel"],
    slots: [
      imageSlot("featureImage", "横向特性图"),
      textSlot("headline", "主标题", "Large cooking area", 24)
    ]
  },
  {
    id: "oven-body-feature",
    name: "Body Sticker / Feature",
    version: "3.0",
    aspectRatio: "4:1",
    placementHints: ["oven body", "door surface", "side panel"],
    slots: [
      imageSlot("featureImage", "特性图"),
      textSlot("headline", "主标题", "Safer cooking", 24),
      textSlot("subheading", "副标题", "Cool-touch design", 30)
    ]
  },
  {
    id: "oven-top-sticker",
    name: "Top Sticker",
    version: "3.0",
    aspectRatio: "5:2",
    placementHints: ["top panel", "control panel", "upper door"],
    slots: [
      imageSlot("featureImage", "特性大图"),
      textSlot("headline", "主标题", "Smart control", 24),
      textSlot("subheading", "副标题", "Simple, precise operation", 34)
    ]
  }
];

export const popTemplateSets: PopTemplateSet[] = [
  {
    productType: "refrigerator",
    name: "冰箱 POP 模板",
    canvas: { width: 1320, height: 800 },
    groups: [
      {
        id: "refrigerator-main-usp",
        name: "Main Sticker - USP",
        bounds: { x: 28, y: 92, width: 470, height: 670 },
        variants: [
          {
            templateId: "main-sticker-usp",
            label: "方案 A",
            bounds: { x: 58, y: 270, width: 190, height: 390 }
          },
          {
            templateId: "main-sticker-usp-footer",
            label: "方案 B",
            bounds: { x: 278, y: 270, width: 190, height: 390 }
          }
        ]
      },
      {
        id: "refrigerator-main-feature",
        name: "Main Sticker - Feature",
        bounds: { x: 514, y: 92, width: 380, height: 670 },
        variants: [
          {
            templateId: "main-sticker-feature",
            label: "方案 A",
            bounds: { x: 548, y: 245, width: 312, height: 176 }
          },
          {
            templateId: "main-sticker-feature-duo",
            label: "方案 B",
            bounds: { x: 548, y: 474, width: 312, height: 176 }
          }
        ]
      },
      {
        id: "refrigerator-inner",
        name: "Inner Sticker & Display",
        bounds: { x: 910, y: 92, width: 380, height: 470 },
        variants: [
          {
            templateId: "inner-sticker-display",
            label: "方案 A",
            bounds: { x: 948, y: 158, width: 304, height: 116 }
          },
          {
            templateId: "inner-sticker-display-left",
            label: "方案 B",
            bounds: { x: 948, y: 298, width: 304, height: 116 }
          },
          {
            templateId: "inner-sticker-display-right",
            label: "方案 C",
            bounds: { x: 948, y: 438, width: 304, height: 116 }
          }
        ]
      },
      {
        id: "refrigerator-side",
        name: "Side Sticker",
        bounds: { x: 910, y: 580, width: 380, height: 182 },
        variants: [
          {
            templateId: "side-sticker",
            label: "固定方案",
            bounds: { x: 950, y: 646, width: 300, height: 90 }
          }
        ]
      }
    ]
  },
  {
    productType: "oven",
    name: "烤箱 POP 模板",
    canvas: { width: 1440, height: 820 },
    groups: [
      {
        id: "oven-main",
        name: "Main Sticker",
        bounds: { x: 28, y: 212, width: 550, height: 566 },
        variants: [
          {
            templateId: "oven-main-hero",
            label: "方案 A",
            bounds: { x: 50, y: 380, width: 238, height: 170 }
          },
          {
            templateId: "oven-main-feature",
            label: "方案 B",
            bounds: { x: 304, y: 380, width: 252, height: 170 }
          }
        ]
      },
      {
        id: "oven-corner",
        name: "Corner Sticker",
        bounds: { x: 610, y: 212, width: 342, height: 264 },
        variants: [
          {
            templateId: "oven-corner-brand",
            label: "固定方案",
            bounds: { x: 636, y: 280, width: 290, height: 174 }
          }
        ]
      },
      {
        id: "oven-inner",
        name: "Inner Display",
        bounds: { x: 968, y: 212, width: 222, height: 264 },
        variants: [
          {
            templateId: "oven-inner-display",
            label: "固定方案",
            bounds: { x: 997, y: 304, width: 164, height: 128 }
          }
        ]
      },
      {
        id: "oven-wobbler-group",
        name: "Wobbler",
        bounds: { x: 1206, y: 212, width: 204, height: 264 },
        variants: [
          {
            templateId: "oven-wobbler",
            label: "固定方案",
            bounds: { x: 1258, y: 272, width: 100, height: 184 }
          }
        ]
      },
      {
        id: "oven-body",
        name: "Body Sticker",
        bounds: { x: 610, y: 498, width: 580, height: 280 },
        variants: [
          {
            templateId: "oven-body-round",
            label: "方案 A",
            bounds: { x: 642, y: 584, width: 144, height: 144 }
          },
          {
            templateId: "oven-body-strip",
            label: "方案 B",
            bounds: { x: 812, y: 586, width: 348, height: 44 }
          },
          {
            templateId: "oven-body-feature",
            label: "方案 C",
            bounds: { x: 812, y: 654, width: 348, height: 88 }
          }
        ]
      },
      {
        id: "oven-top",
        name: "Top Sticker",
        bounds: { x: 1206, y: 498, width: 204, height: 280 },
        variants: [
          {
            templateId: "oven-top-sticker",
            label: "固定方案",
            bounds: { x: 1220, y: 586, width: 176, height: 100 }
          }
        ]
      }
    ]
  }
];

export function getPopTemplateSet(productType: PopProductType): PopTemplateSet {
  const templateSet = popTemplateSets.find((item) => item.productType === productType);
  if (!templateSet) {
    throw new Error("Unknown POP product type: " + productType);
  }
  return templateSet;
}

export function getPopTemplateIds(templateSet: PopTemplateSet): string[] {
  return templateSet.groups.flatMap((group) =>
    group.variants.map((variant) => variant.templateId)
  );
}

export function getPopStickerGroup(
  templateSet: PopTemplateSet,
  templateId: string
): PopStickerGroup | undefined {
  return templateSet.groups.find((group) =>
    group.variants.some((variant) => variant.templateId === templateId)
  );
}

export function inferPopProductType(product: ProductWithProfile): PopProductType {
  const signature = [
    product.id,
    product.category,
    product.profile.category,
    product.modelName,
    product.displayName
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    signature.includes("oven") ||
    signature.includes("cooking") ||
    signature.includes("烤箱")
  ) {
    return "oven";
  }

  return "refrigerator";
}
