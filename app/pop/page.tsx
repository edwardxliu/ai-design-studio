import { AppShell } from "@/src/components/AppShell";
import { PopCanvasStudio } from "@/src/components/PopCanvasStudio";
import { createDemoAssetStore } from "@/src/services/demo-api";
import { createDefaultProductRegistry } from "@/src/services/product-registry";
import styles from "@/src/components/PopCanvasStudio.module.css";

// Product list includes user-created products, so render per request.
export const dynamic = "force-dynamic";

export default async function PopPage() {
  const products = await createDefaultProductRegistry(createDemoAssetStore()).listProducts();

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.pageHeading}>
          <h1>POP 物料设计</h1>
          <p>选择物料模板，生成并下载整套零售宣传物料。当前支持冰箱 / 烤箱模板，本地渲染与拖拽贴装预览。</p>
        </header>
        <PopCanvasStudio products={products} />
      </div>
    </AppShell>
  );
}
