import { AppShell } from "@/src/components/AppShell";
import { ProductVideoStudio } from "@/src/components/ProductVideoStudio";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";

export const dynamic = "force-dynamic";

export default async function ProductVideoPage() {
  const products = await createDefaultProductRegistry(createDemoAssetStore()).listProducts();

  return (
    <AppShell>
      <header style={{ marginBottom: 18 }}>
        <p className="eyebrow">Hero Product Film</p>
        <h1 style={{ fontSize: 30, margin: "4px 0 8px" }}>产品视频</h1>
        <p style={{ color: "#5f6c7b", margin: 0 }}>
          豆包 Seedance 1.5 Pro · 12 秒 · 16:9 · 720p
        </p>
      </header>
      <ProductVideoStudio products={products} />
    </AppShell>
  );
}
