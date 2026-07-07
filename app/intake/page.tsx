import { AppShell } from "@/src/components/AppShell";
import { AssetPicker } from "@/src/components/AssetPicker";
import { demoProducts } from "@/src/domain/demo-data";

export default function IntakePage() {
  const product = demoProducts[0];

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Asset Intake</h1>
      <p style={{ color: "#5f6c7b", maxWidth: 760 }}>
        Load the demo pack or upload product photos, brand rules, POP/PDP references, and
        feature images. The same flow supports any uploaded product category.
      </p>
      <AssetPicker assets={product.assets} label="Recognized demo assets" />
    </AppShell>
  );
}

