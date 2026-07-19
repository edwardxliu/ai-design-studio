export type IconDesignVariantId =
  | "standard-black"
  | "midea-blue"
  | "blue-background"
  | "deep-blue-background"
  | "layout-vertical"
  | "layout-horizontal";

export type IconDesignVariant = {
  id: IconDesignVariantId;
  group: "color" | "layout";
  label: string;
  description: string;
  size: "1024x1024" | "1536x1024";
  instruction: string;
};

export const ICON_DESIGN_VARIANTS: IconDesignVariant[] = [
  {
    id: "standard-black",
    group: "color",
    label: "标准黑色",
    description: "白底、黑色线性 Icon、黑色圆形描边",
    size: "1024x1024",
    instruction:
      "Render the symbol in black on a pure white background, enclosed by a black outlined circle. Do not include the feature title in this color-only asset."
  },
  {
    id: "midea-blue",
    group: "color",
    label: "蓝色高亮",
    description: "白底、美的蓝线性 Icon、美的蓝圆形描边",
    size: "1024x1024",
    instruction:
      "Render the symbol in Midea Blue #0092D8 on a pure white background, enclosed by a Midea Blue outlined circle. Do not include the feature title in this color-only asset."
  },
  {
    id: "blue-background",
    group: "color",
    label: "蓝底版本",
    description: "美的蓝背景、白色实心圆、圆内美的蓝 Icon",
    size: "1024x1024",
    instruction:
      "Use a solid Midea Blue #0092D8 background. Place a white filled circle in the center and render the symbol inside it in Midea Blue #0092D8. Do not include the feature title."
  },
  {
    id: "deep-blue-background",
    group: "color",
    label: "深蓝底版本",
    description: "美的深蓝背景、美的蓝实心圆、圆内白色 Icon",
    size: "1024x1024",
    instruction:
      "Use a solid Midea Deep Blue #00284C background. Place a Midea Blue #0092D8 filled circle in the center and render the symbol inside it in white #FFFFFF. Do not include the feature title."
  },
  {
    id: "layout-vertical",
    group: "layout",
    label: "上下排版",
    description: "Icon 居中，卖点标题位于下方",
    size: "1024x1024",
    instruction:
      "Create Layout A only: use the official Midea Blue outlined-circle icon on white, centered, with the feature title directly below. Set the title in Gotham Medium or the closest metric-compatible sans serif, center aligned. Vertical spacing must equal 15% of the icon height."
  },
  {
    id: "layout-horizontal",
    group: "layout",
    label: "左右排版",
    description: "Icon 在左，卖点标题位于右侧",
    size: "1536x1024",
    instruction:
      "Create Layout B only: use the official Midea Blue outlined-circle icon on white at left, with the feature title at right. Set the title in Gotham Medium or the closest metric-compatible sans serif, left aligned. Horizontal spacing must equal 15% of the icon width."
  }
];

export const DEFAULT_ICON_VI_PROMPT_TEMPLATE = [
  "Use image 1 as the authoritative brand color guideline and image 2 as the authoritative product feature icon VI guideline. Use image 3 only as the semantic source symbol that must be redrawn; do not copy its original styling.",
  "Create one premium appliance feature icon that strictly follows the supplied VI references.",
  "Icon style: minimal geometric outline icon, uniform stroke, rounded line caps, rounded line joins, circular container, balanced composition, and premium industrial design character.",
  "Do not use gradients, shadows, perspective, photographic effects, decorative textures, extra symbols, or unapproved colors.",
  "Brand colors: Midea Blue #0092D8, Midea Deep Blue #00284C, White #FFFFFF, Black #000000, and Mid Grey #808080. When the uploaded brand guideline differs, the uploaded guideline takes precedence.",
  "Typography for layouts: Gotham Medium, or the closest metric-compatible sans serif only when Gotham Medium is unavailable.",
  "Feature title: {{FEATURE_TITLE}}.",
  "Only the source symbol and feature title may change. Stroke weight, circular container, spacing, alignment, typography, and color application must remain consistent with the uploaded VI."
].join("\n");

export function isIconDesignVariantId(value: unknown): value is IconDesignVariantId {
  return ICON_DESIGN_VARIANTS.some((variant) => variant.id === value);
}

export function getIconDesignVariant(id: IconDesignVariantId): IconDesignVariant {
  const variant = ICON_DESIGN_VARIANTS.find((item) => item.id === id);
  if (!variant) {
    throw new Error(`Unknown Icon Design variant: ${id}`);
  }
  return variant;
}

export function buildIconDesignPrompt(input: {
  template: string;
  featureTitle: string;
  variantId: IconDesignVariantId;
}): string {
  const variant = getIconDesignVariant(input.variantId);
  const featureTitle = input.featureTitle.trim();
  if (!featureTitle) {
    throw new Error("Feature title is required.");
  }

  const rawTemplate = input.template.trim() || DEFAULT_ICON_VI_PROMPT_TEMPLATE;
  const resolvedTemplate = rawTemplate.includes("{{FEATURE_TITLE}}")
    ? rawTemplate.replaceAll("{{FEATURE_TITLE}}", featureTitle)
    : `${rawTemplate}\nFeature title: ${featureTitle}.`;

  return [
    resolvedTemplate,
    `OUTPUT VARIANT: ${variant.label}. ${variant.instruction}`,
    "Generate exactly one standalone finished artwork for this variant, not a contact sheet, comparison board, mockup, or collection of alternatives.",
    "Preserve the semantic meaning and recognizable geometry of the source symbol from image 3 while fully replacing its visual style with the VI system. Keep all edges crisp and all text accurately spelled."
  ].join("\n\n");
}