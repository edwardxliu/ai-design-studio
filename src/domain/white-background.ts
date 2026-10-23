import { z } from "zod";
import type { Asset, AssetType } from "./types";

export type WhiteBackgroundSourceState = "closed" | "open";
export type WhiteBackgroundAngleId = "left-45" | "front" | "right-45";

export const WHITE_BACKGROUND_SOURCE_OPTIONS: ReadonlyArray<{
  id: WhiteBackgroundSourceState;
  assetType: AssetType;
  label: string;
  groupLabel: string;
}> = [
  {
    id: "closed",
    assetType: "white-background-closed",
    label: "关门产品图",
    groupLabel: "关门图三视角"
  },
  {
    id: "open",
    assetType: "white-background-open",
    label: "开门产品图",
    groupLabel: "开门图三视角"
  }
];

export const WHITE_BACKGROUND_SOURCE_TYPES: Record<WhiteBackgroundSourceState, AssetType> = {
  closed: "white-background-closed",
  open: "white-background-open"
};

export const WHITE_BACKGROUND_ANGLES: ReadonlyArray<{
  id: WhiteBackgroundAngleId;
  label: string;
  instruction: string;
}> = [
  {
    id: "left-45",
    label: "左侧 45°",
    instruction: "相机位于产品左前方 45°，完整展示产品左侧与正面"
  },
  {
    id: "front",
    label: "正视",
    instruction: "相机正对产品中心，保持水平垂直线准确，不产生俯视或仰视畸变"
  },
  {
    id: "right-45",
    label: "右侧 45°",
    instruction: "相机位于产品右前方 45°，完整展示产品右侧与正面"
  }
];

export function isWhiteBackgroundSourceState(value: unknown): value is WhiteBackgroundSourceState {
  return value === "closed" || value === "open";
}

export function buildWhiteBackgroundPrompt(
  sourceState: WhiteBackgroundSourceState,
  angleId: string | undefined
): string {
  const angle = WHITE_BACKGROUND_ANGLES.find((item) => item.id === angleId);
  if (!angle) {
    throw new Error(`Unsupported white-background angle: ${angleId ?? "missing"}`);
  }

  const stateInstruction = sourceState === "open"
    ? "保持参考图中的门体开启角度、内部结构和所有可见部件完全一致，不得关闭、移动或改变门体。"
    : "保持参考图中的全部门体处于关闭状态，不得打开门体或虚构内部结构。";

  return [
    "以我上传的产品图片作为唯一且准确的参考，重建同一台产品的不同视角，而不是生成一款相似的产品。",
    stateInstruction,
    `本次只生成一个产品、一个视角：${angle.label}。${angle.instruction}。不要拼接多个视角，不要在画面中重复产品。`,
    "严格保持产品几何结构、比例尺寸、材质、颜色、Logo 位置以及所有结构细节完全一致，不允许修改、简化、移动、新增或删除任何零部件。",
    "除相机位置外，不改变产品的任何内容，并保持真实、合理的透视关系。",
    "商业级产品摄影风格，纯白无缝背景（#FFFFFF），无道具、无场景、无文字，只有柔和自然的产品阴影。",
    "使用柔和均匀的棚拍光线，材质反射真实自然，画面干净，高精度、超写实，达到产品目录（Catalog）级别的商业摄影品质。"
  ].join("");
}

// Keep the legacy competition's three-angle contract above stable.
export const WHITE_BACKGROUND_VIEW_OPTIONS = [
  { id: "front", label: "正面 · 0°", mark: "F", instruction: "相机正对产品正面中心，水平拍摄" },
  { id: "left-45", label: "左前 · 45°", mark: "F", instruction: "相机位于产品左前方45度，展示正面和左侧" },
  { id: "right-45", label: "右前 · 45°", mark: "R", instruction: "相机位于产品右前方45度，展示正面和右侧" },
  { id: "right-90", label: "右侧 · 90°", mark: "R", instruction: "相机位于产品正右侧90度，展示完整右侧面" },
  { id: "back", label: "背面 · 180°", mark: "B", instruction: "相机位于产品背面180度，展示背部" },
  { id: "top", label: "俯视 · 90°", mark: "T", instruction: "相机从产品正上方90度垂直俯视，展示顶部" }
] as const;
export type WhiteBackgroundViewId = typeof WHITE_BACKGROUND_VIEW_OPTIONS[number]["id"];
export const WHITE_BACKGROUND_SIZE_OPTIONS = [
  { id: "square", label: "1:1", width: 2000, height: 2000, hint: "电商商品主图" },
  { id: "portrait", label: "4:5", width: 1600, height: 2000, hint: "移动端商品卡" },
  { id: "landscape", label: "16:9", width: 1920, height: 1080, hint: "官网横幅" }
] as const;
const requestSchema = z.object({
  productId: z.string().trim().min(1),
  referenceAssetIds: z.array(z.string().min(1)).min(1).max(3).refine((ids) => new Set(ids).size === ids.length, "参考图不可重复"),
  angle: z.enum(["front", "left-45", "right-45", "right-90", "back", "top"]),
  sourceState: z.enum(["as-reference", "closed", "open"]),
  autoRemoveBackground: z.boolean(), whiteBackground: z.boolean(), naturalShadow: z.boolean(),
  width: z.number().int().min(256).max(4096), height: z.number().int().min(256).max(4096),
  imageModel: z.enum(["openai", "doubao"])
});
export type WhiteBackgroundRequest = z.infer<typeof requestSchema>;
export type WhiteBackgroundOutput = { angle: WhiteBackgroundViewId; url: string; model: string; width: number; height: number; sourceAssetIds: string[]; prompt: string; generatedAt: string };
export function parseWhiteBackgroundRequest(value: unknown): WhiteBackgroundRequest {
  return requestSchema.parse(value);
}
export function validateWhiteBackgroundReferences(
  input: Pick<WhiteBackgroundRequest, "productId" | "referenceAssetIds"> & { sourceState: string }, assets: Asset[]
): Asset[] {
  if (input.referenceAssetIds.length < 1 || input.referenceAssetIds.length > 3) throw new Error("请选择1–3张同一产品的参考图。");
  const selected = input.referenceAssetIds.map((id) => assets.find((asset) => asset.id === id));
  if (selected.some((asset) => !asset || asset.productId !== input.productId)) throw new Error("参考图必须属于当前产品。");
  const references = selected as Asset[];
  if (references.some((asset) => !["product-photo", "phone-shot", "white-background-open", "white-background-closed"].includes(asset.type) || !/\.(png|jpe?g|webp)$/i.test(asset.filename))) throw new Error("请选择PNG、JPG或WebP产品图片。");
  const open = references.some((a) => a.type === "white-background-open");
  const closed = references.some((a) => a.type === "white-background-closed");
  if (open && closed) throw new Error("开门与关门参考图不能混用，请分两次生成。");
  if ((open && input.sourceState === "closed") || (closed && input.sourceState === "open")) throw new Error("参考图与所选产品状态不匹配。");
  return references;
}
export function buildMultiAngleWhitePrompt(input: Pick<WhiteBackgroundRequest, "autoRemoveBackground" | "whiteBackground" | "naturalShadow"> & { angle: string; sourceState: string }): string {
  const angle = WHITE_BACKGROUND_VIEW_OPTIONS.find((item) => item.id === input.angle);
  if (!angle) throw new Error("不支持的生成角度。");
  return [
    "所有参考图片描述同一台产品。第一张为主体结构参考，其余仅用于补充同一状态的可见细节。",
    "严格保持产品几何结构、比例、材质、颜色、Logo位置和零部件。不得新增、删除或改变产品结构。不可见区域仅合理补全，不可设计新产品。",
    input.sourceState === "open" ? "保持参考图门体开启角度、内部结构和所有可见部件一致。" : input.sourceState === "closed" ? "保持全部门体处于关闭状态，不虚构内部结构。" : "保持第一张参考图的开关门与部件状态，其余参考不得覆盖该状态。",
    `仅生成一个产品、一个视角：${angle.label}；${angle.instruction}。不要拼接或重复产品。完整保留产品轮廓，四周留出安全边距。`,
    input.autoRemoveBackground ? "自动抠取产品轮廓，清除背景杂物和边缘残留。" : "不进行额外的自动抠图，保持产品边缘和细小部件完整。",
    input.whiteBackground ? "背景替换为纯白无缝背景#FFFFFF，无道具和文字。" : "保留参考图原背景的颜色与质感，合理延展背景。",
    input.naturalShadow ? "保留柔和自然的接触阴影，光线与产品一致。" : "不添加投影，移除地面投影。",
    "商业产品摄影，真实透视，均匀棚拍光线，材质反射自然。"
  ].join("");
}
