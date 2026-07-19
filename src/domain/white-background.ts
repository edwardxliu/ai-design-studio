import type { AssetType } from "./types";

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
