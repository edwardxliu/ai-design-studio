import { AppShell } from "@/src/components/AppShell";
import { ProductProfilePanel } from "@/src/components/ProductProfilePanel";

export default function ProductsPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>产品档案</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 860 }}>
        每个产品的卖点档案由「产品信息」素材识别而来,可手工修正、排序与补充。
        档案用于 PDP 动态段落与产品图生成提示词；POP 使用固定模板占位文案。
      </p>
      <ProductProfilePanel />
    </AppShell>
  );
}
