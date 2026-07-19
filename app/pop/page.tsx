import { AppShell } from "@/src/components/AppShell";
import { PopCanvasStudio } from "@/src/components/PopCanvasStudio";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";

// Product list includes user-created products, so render per request.
export const dynamic = "force-dynamic";

export default async function PopPage() {
  const products = await createDefaultProductRegistry(createDemoAssetStore()).listProducts();

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>POP 设计</h1>
      <p style={{ color: "#5f6c7b" }}>冰箱 / 烤箱产品类型模板</p>
      <PopCanvasStudio products={products} />
    </AppShell>
  );
}