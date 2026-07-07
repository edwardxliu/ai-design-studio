import { AppShell } from "@/src/components/AppShell";
import { AssetPicker } from "@/src/components/AssetPicker";
import { UploadPanel } from "@/src/components/UploadPanel";
import { demoProducts } from "@/src/domain/demo-data";

export default function IntakePage() {
  const product = demoProducts[0];

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Asset Intake</h1>
      <p style={{ color: "#5f6c7b", maxWidth: 760 }}>
        Start with the demo pack or upload product photos, brand rules, POP/PDP references,
        and feature images for any product category.
      </p>
      <div style={{ display: "grid", gap: 18 }}>
        <UploadPanel />
        <AssetPicker assets={product.assets} label="Recognized demo assets" />
      </div>
    </AppShell>
  );
}
