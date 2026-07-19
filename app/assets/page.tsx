import { AppShell } from "@/src/components/AppShell";
import { AssetLibrary } from "@/src/components/AssetLibrary";

export default function AssetsPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>素材库</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 860 }}>
        存储和管理产品信息、品牌规范、模板资料与样例素材。这里入库的素材决定后续所有生成功能的输入:
        产品信息驱动卖点识别与 PDP,品牌规范约束生成风格,样例素材作为图像生成参考图与模板配图。
      </p>
      <AssetLibrary />
    </AppShell>
  );
}
