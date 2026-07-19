export type PhoneStandardizationAngleId =
  | "studio-left-45"
  | "studio-front"
  | "studio-right-45";

export const PHONE_STANDARDIZATION_ANGLES: ReadonlyArray<{
  id: PhoneStandardizationAngleId;
  label: string;
  instruction: string;
}> = [
  {
    id: "studio-left-45",
    label: "左侧 45°",
    instruction: "相机位于产品左前方 45°，完整展示产品左侧与正面"
  },
  {
    id: "studio-front",
    label: "正视",
    instruction: "相机正对产品中心，校正垂直线和水平线，不产生俯视、仰视或广角畸变"
  },
  {
    id: "studio-right-45",
    label: "右侧 45°",
    instruction: "相机位于产品右前方 45°，完整展示产品右侧与正面"
  }
];

export function buildPhoneStandardizationPrompt(angleId: string | undefined): string {
  const angle = PHONE_STANDARDIZATION_ANGLES.find((item) => item.id === angleId);
  if (!angle) {
    throw new Error(`Unsupported phone-standardization angle: ${angleId ?? "missing"}`);
  }

  return [
    "以我上传的手机随拍或非标准产品图片作为唯一且准确的产品参考，将其重建为同一台产品的标准化摄影棚产品图，而不是重新设计或生成一款相似产品。",
    `本次只生成一个产品、一个视角：${angle.label}。${angle.instruction}。不要拼接多个视角，不要在画面中重复产品。`,
    "彻底排除原图复杂场景造成的环境倒影、杂乱反射、有色光照和色偏，恢复产品材质本身应有的真实颜色与反射。",
    "删除产品表面及周围的贴纸、价签、宣传物料、包装、杂物和所有与产品无关的物品；不得删除产品原生 Logo、控制面板、把手、门体、旋钮、接口或结构零件。",
    "这是同一个三维产品模型的多视角重建。严格保持产品几何结构、比例尺寸、材质、颜色、Logo 位置和所有产品原生结构细节完全一致，不允许修改、简化、移动、新增或删除零部件。",
    "保持真实、合理的透视关系，并修正手机拍摄造成的透视倾斜、镜头畸变和比例失真。",
    "商业级产品摄影风格，纯白无缝背景（#FFFFFF），柔和均匀的摄影棚光线，只有适当且自然的高光与柔和阴影，用于突出产品结构和材质质感。",
    "画面干净、高精度、超写实，达到产品目录（Catalog）级别的商业摄影品质，无场景、无人物、无文字、无额外装饰。"
  ].join("");
}