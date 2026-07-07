import { AppShell } from "@/src/components/AppShell";
import { OutputLabel } from "@/src/components/OutputLabel";
import { PopGenerationPanel } from "@/src/components/PopGenerationPanel";
import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { defaultPopTemplates, renderPopFlatPayload } from "@/src/domain/pop";

export default function PopPage() {
  const product = getPrimaryDemoProduct();
  const template = defaultPopTemplates[0];
  const payload = renderPopFlatPayload({
    templateId: template.id,
    country: "Mexico",
    language: "Spanish",
    textValues: {
      headline: "640L, same kitchen footprint",
      subline: "More storage without remodeling"
    },
    imageValues: {
      featureImage: "asset-capacity-icon"
    }
  });

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>POP Template Studio</h1>
      <p style={{ color: "#5f6c7b", maxWidth: 820 }}>
        Fixed POP templates expose editable text and image slots, then generate a realistic product photo with the POP attached.
      </p>
      <div style={{ display: "grid", gap: 18 }}>
        <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 6px" }}>{template.name}</h2>
              <p style={{ color: "#5f6c7b", margin: 0 }}>{template.id} / {template.version}</p>
            </div>
            <OutputLabel
              productName={product.displayName ?? "Uploaded product"}
              country={payload.country}
              language={payload.language}
              templateType="POP"
              templateVersion={payload.templateVersion}
            />
          </div>
        </section>
        <PopGenerationPanel
          productName={product.displayName ?? "Uploaded product"}
          initialHeadline={payload.textValues.headline ?? "Product feature"}
          initialSubline={payload.textValues.subline ?? "Localized sales message"}
          flatPopAssetId="pop-flat-render"
        />
      </div>
    </AppShell>
  );
}
