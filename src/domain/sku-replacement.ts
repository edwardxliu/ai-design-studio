export type SkuReplacementMode = "reference-part" | "color" | "style";

export type SkuReplacementPromptInput = {
  mode: SkuReplacementMode;
  instruction: string;
  selectionDescription?: string;
  maskAsReference?: boolean;
};

export const SKU_REPLACEMENT_MODES = [
  {
    id: "reference-part",
    label: "参考图部件替换",
    shortLabel: "双图替换",
    description: "产品整机图与新部件图缺一不可，按参考图完整替换指定配件。"
  },
  {
    id: "color",
    label: "配件颜色替换",
    shortLabel: "颜色 / 材质",
    description: "在产品图上选择部件区域，只修改选区内的颜色和材质。"
  },
  {
    id: "style",
    label: "配件样式替换",
    shortLabel: "造型 / 结构",
    description: "在产品图上选择部件区域，通过提示词修改局部款式或结构。"
  }
] as const;

export const DEFAULT_SKU_PROMPTS: Record<SkuReplacementMode, string> = {
  "reference-part":
    "将产品顶部控制面板的丝印按键、图标布局完全替换为第二张控制面板的设计方案。丝印线条粗细、图标风格、按键底色和第二张图完全一致；屏幕保持第一张产品图的点亮显示效果。其余所有结构细节严格保留不变。",
  color:
    "将产品顶部控制面板的银色金属包边、下方银色不锈钢把手替换成暖铜色玫瑰金材质。保留产品原本的机身、视窗、品牌 Logo、操作面板丝印、整体外观造型与尺寸比例。",
  style:
    "完全替换选中把手的款式，让把手设计更圆润、极简，并增加一个圆形结构。其余所有结构细节严格保留不变，保留机身、包边、视窗、品牌 Logo、操作面板丝印、整体造型与尺寸比例。"
};

export function isSkuReplacementMode(value: unknown): value is SkuReplacementMode {
  return value === "reference-part" || value === "color" || value === "style";
}

export function buildSkuReplacementPrompt(input: SkuReplacementPromptInput): string {
  const instruction = input.instruction.trim();
  if (!instruction) {
    throw new Error("请填写局部替换要求。");
  }

  if (input.mode === "reference-part") {
    return [
      "image 1 是唯一且准确的产品整机基础原型，image 2 是唯一且准确的新配件/部件参考。",
      "只替换用户指定的局部配件或部件；必须严格复现 image 2 的结构、比例、材质、颜色、图标、文字与细节，不得把 image 2 的背景带入结果。",
      instruction,
      preserveProductConstraints(),
      studioOutputConstraints()
    ].join("\n");
  }

  const selection = input.selectionDescription?.trim() || "用户在蒙版中选中的产品部件";
  const operation = input.mode === "color" ? "颜色与材质" : "款式、造型与局部结构";
  return [
    "image 1 是唯一且准确的产品整机基础原型。",
    `只允许修改选区蒙版覆盖的“${selection}”的${operation}；蒙版外所有像素对应的产品结构和视觉细节都必须保持不变。`,
    input.maskAsReference
      ? "image 2 是选区蒙版参考：透明区域是允许编辑区，白色不透明区域是严格保护区，不得把蒙版颜色输出到结果中。"
      : "编辑范围由随请求提交的透明蒙版限定：透明区域允许编辑，白色不透明区域严格保护。",
    instruction,
    preserveProductConstraints(),
    studioOutputConstraints()
  ].join("\n");
}

function preserveProductConstraints(): string {
  return "除指定替换区域外，严格保留产品原图的几何结构、尺寸比例、机身、视窗、Logo、丝印、接缝、材质细节、光影与相机视角；不允许修改、简化、移动、新增或删除其他零部件。";
}

function studioOutputConstraints(): string {
  return "保持原图构图，采用柔和均匀的白底影棚布光，材质反射真实自然，画面高清干净，边缘利落写实，无多余改动、无额外文字、无额外物体。";
}