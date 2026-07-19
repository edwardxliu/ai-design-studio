import type { GenerationTaskType, ProductWithProfile } from "./types";
import type { WhiteBackgroundSourceState } from "./white-background";

export type CompetitionPhase = "task-1" | "task-2";

export type CompetitionTaskId =
  | "task1-white-background-6"
  | "task1-phone-to-studio-6"
  | "task1-sku-replacement-group"
  | "task2-style-transfer-3"
  | "task2-motion-direction";

export type CompetitionProductTarget = "primary";

export type CompetitionOutputKind =
  | "image"
  | "pdp-long-image"
  | "motion-storyboard";

export type SkuReplacementKind =
  | "reference-part-replacement"
  | "color-replacement"
  | "prompt-part-replacement";

export type CompetitionOutputSpec = {
  id: string;
  label: string;
  kind: CompetitionOutputKind;
  generationType: GenerationTaskType;
  productTarget: CompetitionProductTarget;
  country: string;
  language: string;
  promptFocus: string;
  sourceAssetIds: string[];
  angle?: string;
  styleName?: string;
  skuReplacementKind?: SkuReplacementKind;
  templateType?: "POP" | "PDP";
  templateVersion?: string;
  templateId?: string;
  sourceState?: WhiteBackgroundSourceState;
};

export type CompetitionTaskSpec = {
  id: CompetitionTaskId;
  phase: CompetitionPhase;
  title: string;
  requirement: string;
  requiredCount: number;
  summary: string;
  productTarget: CompetitionProductTarget;
  coverageTags: string[];
  outputs: CompetitionOutputSpec[];
};

export type CompetitionCoverageSummary = {
  taskCount: number;
  outputCount: number;
  coverageTags: string[];
};

const primarySourceAssets: string[] = [];

export const competitionTasks: CompetitionTaskSpec[] = [
  {
    id: "task1-white-background-6",
    phase: "task-1",
    title: "白底三视角产品图",
    requirement: "每张已上传的产品状态图生成左侧 45°、正视、右侧 45°三张白底图；上传一张输出 3 张，上传开门和关门两张则输出 6 张。",
    requiredCount: 3,
    summary: "开门图和关门图分别作为唯一产品参考，严格保留对应状态与产品结构，生成 Catalog 级纯白背景三视角产品图。",
    productTarget: "primary",
    coverageTags: ["task1-white-background", "three-view-per-source", "base-material"],
    outputs: angleOutputs("white-background", [
      ["left-45", "Left 45 degree view with clean panel visibility."],
      ["front", "Front view, straight-on white background product packshot."],
      ["right-45", "Right 45 degree view with handle and door geometry preserved."]
    ])
  },
  {
    id: "task1-phone-to-studio-6",
    phase: "task-1",
    title: "手机图标准化三视角",
    requirement: "上传 1 张手机拍摄图或非标准产品图，输出正视、左侧 45°、右侧 45°三张接近摄影棚水平的标准化产品图。",
    requiredCount: 3,
    summary: "清除复杂场景反射、有色光照、贴纸和无关物品，保持同一产品结构与材质，重建 Catalog 级纯白背景三视角。",
    productTarget: "primary",
    coverageTags: ["task1-phone-standardize", "studio-product-photo", "three-view"],
    outputs: angleOutputs("standardize-phone-shot", [
      ["studio-left-45", "Studio left 45 view with corrected vertical lines."],
      ["studio-front", "Studio front view reconstructed from a phone snapshot."],
      ["studio-right-45", "Studio right 45 view with consistent shadow direction."]
    ])
  },
  {
    id: "task1-sku-replacement-group",
    phase: "task-1",
    title: "SKU 局部替换组合",
    requirement: "完成参考部件图替换、选区颜色替换、选区样式替换三类 SKU 局部编辑。",
    requiredCount: 3,
    summary: "产品与部件类型由用户上传决定；只修改指定部件，其余整机结构和视觉细节严格保留。",
    productTarget: "primary",
    coverageTags: ["task1-sku", "reference-part-replacement", "mask-color-replacement", "mask-style-replacement"],
    outputs: [
      skuOutput("sku-reference-part", "Reference part replacement", "reference-part-replacement", "Replace only the specified part using the second uploaded image as the exact part reference."),
      skuOutput("sku-color", "Masked color replacement", "color-replacement", "Change only the masked component color or material while preserving every unmasked detail."),
      skuOutput("sku-style", "Masked part style replacement", "prompt-part-replacement", "Change only the masked component style or geometry from the user's prompt.")
    ]
  },
  {
    id: "task2-style-transfer-3",
    phase: "task-2",
    title: "风格迁移(3 种)",
    requirement: "输出至少 3 个风格迁移结果。",
    requiredCount: 3,
    summary: "同一产品在不同广告视觉风格中保持结构一致。",
    productTarget: "primary",
    coverageTags: ["task2-style-transfer", "three-styles", "localization"],
    outputs: [
      styleOutput("style-premium-studio", "Premium studio", "Premium high-end studio key visual with soft reflections."),
      styleOutput("style-family-kitchen", "Family kitchen", "Warm family kitchen lifestyle scene with realistic use context."),
      styleOutput("style-retail-launch", "Retail launch", "Bright retail launch display style with clean promotional lighting.")
    ]
  },
  {
    id: "task2-motion-direction",
    phase: "task-2",
    title: "产品视频方向 / 动态延展",
    requirement: "输出 1 个产品视频方向样例或同等动态延展，并说明固定结构、关键输入、可复用模块、变体生成。",
    requiredCount: 1,
    summary: "生成 6 镜头视频脚本和可复用模块说明，供现场讲解动态物料扩展。",
    productTarget: "primary",
    coverageTags: ["task2-motion", "storyboard", "dynamic-extension"],
    outputs: [
      {
        id: "motion-six-shot-storyboard",
        label: "6-shot motion storyboard",
        kind: "motion-storyboard",
        generationType: "motion-storyboard",
        productTarget: "primary",
        country: "Mexico",
        language: "Spanish",
        promptFocus: "Create a product video direction with fixed structure, key inputs, reusable modules, and variant generation notes.",
        sourceAssetIds: primarySourceAssets
      }
    ]
  },
  ];

export function getCompetitionTaskSpec(taskId: CompetitionTaskId): CompetitionTaskSpec {
  const task = competitionTasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Unknown competition task: ${taskId}`);
  }

  return task;
}


export function getCompetitionCoverageSummary(): CompetitionCoverageSummary {
  const outputs = competitionTasks.flatMap((task) => task.outputs);
  const coverageTags = new Set(competitionTasks.flatMap((task) => task.coverageTags));

  return {
    taskCount: competitionTasks.length,
    outputCount: outputs.length,
    coverageTags: Array.from(coverageTags)
  };
}

export function buildCompetitionPrompt(
  product: ProductWithProfile,
  output: CompetitionOutputSpec
): string {
  const sellingPoints = product.profile.detectedFeatures
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .map((point) => `${point.shortLabel}: ${point.benefit}`)
    .join(" | ");

  return [
    `Create a demo-ready overseas marketing asset for ${product.displayName ?? "uploaded product"}.`,
    `Product category: ${product.category}. Brand: ${product.brand ?? "Midea"}.`,
    `Output: ${output.label}. Market: ${output.country}. Language: ${output.language}.`,
    output.angle ? `Required angle: ${output.angle}.` : "",
    output.styleName ? `Visual style: ${output.styleName}.` : "",
    output.skuReplacementKind ? `SKU replacement category: ${output.skuReplacementKind}.` : "",
    output.templateType ? `Template type: ${output.templateType} ${output.templateVersion ?? ""}.` : "",
    `Recognized selling points: ${sellingPoints}.`,
    output.promptFocus,
    output.generationType === "white-background"
      ? "Hard requirement: pure white seamless background (#FFFFFF) across the entire frame, no props, no environment, no gradient backdrop; keep only a soft natural product shadow."
      : "",
    "Preserve the real product shape, proportions, logo placement, panel layout, and physical configuration.",
    "Use clean commercial lighting and avoid adding unapproved product claims."
  ]
    .filter(Boolean)
    .join(" ");
}

function angleOutputs(
  generationType: GenerationTaskType,
  angles: Array<[string, string]>
): CompetitionOutputSpec[] {
  return angles.map(([angle, promptFocus]) => ({
    id: `${generationType}-${angle}`,
    label: angle.replace(/-/g, " "),
    kind: "image",
    generationType,
    productTarget: "primary",
    country: "Mexico",
    language: "Spanish",
    promptFocus,
    sourceAssetIds: primarySourceAssets,
    angle
  }));
}

function skuOutput(
  id: string,
  label: string,
  skuReplacementKind: SkuReplacementKind,
  promptFocus: string
): CompetitionOutputSpec {
  return {
    id,
    label,
    kind: "image",
    generationType: "sku-variant",
    productTarget: "primary",
    country: "Mexico",
    language: "Spanish",
    promptFocus,
    sourceAssetIds: primarySourceAssets,
    skuReplacementKind
  };
}

function styleOutput(id: string, styleName: string, promptFocus: string): CompetitionOutputSpec {
  return {
    id,
    label: styleName,
    kind: "image",
    generationType: "style-transfer",
    productTarget: "primary",
    country: "Mexico",
    language: "Spanish",
    promptFocus,
    sourceAssetIds: primarySourceAssets,
    styleName
  };
}

function popOutput(
  id: string,
  label: string,
  templateId: string,
  placement: string
): CompetitionOutputSpec {
  return {
    id,
    label,
    kind: "image",
    generationType: "pop-product-scene",
    productTarget: "primary",
    country: "Mexico",
    language: "Spanish",
    promptFocus: `Render the editable POP template ${templateId} on the product ${placement} as a realistic photographed product scene.`,
    sourceAssetIds: primarySourceAssets,
    templateType: "POP",
    templateId,
    templateVersion: "1.0"
  };
}

