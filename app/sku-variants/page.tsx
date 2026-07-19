import { AppShell } from "@/src/components/AppShell";
import { SkuReplacementStudio } from "@/src/components/SkuReplacementStudio";

export default function Page() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>SKU 局部替换</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 920 }}>
        使用参考部件图或局部选区精确修改产品配件，支持颜色、材质、款式和局部结构替换。
      </p>
      <SkuReplacementStudio />
    </AppShell>
  );
}