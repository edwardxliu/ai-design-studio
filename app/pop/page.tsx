import { AppShell } from "@/src/components/AppShell";
import { OutputLabel } from "@/src/components/OutputLabel";
import { getPrimaryDemoProduct } from "@/src/domain/demo-data";
import { buildPopScenePrompt, defaultPopTemplates, renderPopFlatPayload } from "@/src/domain/pop";

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
  const prompt = buildPopScenePrompt({
    productName: product.displayName ?? "Uploaded product",
    placement: "front panel",
    flatPopAssetId: "pop-flat-render"
  });

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>POP Template Studio</h1>
      <p style={{ color: "#5f6c7b", maxWidth: 820 }}>
        Fixed POP templates expose editable text and image slots. After flat rendering,
        the system generates a realistic product photo with the POP attached.
      </p>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr" }}>
        <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 18 }}>
          <h2>{template.name}</h2>
          <label>Headline</label>
          <input style={{ display: "block", margin: "6px 0 12px", width: "100%" }} defaultValue={payload.textValues.headline} />
          <label>Feature image asset</label>
          <input style={{ display: "block", marginTop: 6, width: "100%" }} defaultValue={payload.imageValues.featureImage} />
        </section>
        <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 18 }}>
          <h2>Output label</h2>
          <OutputLabel
            productName={product.displayName ?? "Uploaded product"}
            country={payload.country}
            language={payload.language}
            templateType="POP"
            templateVersion={payload.templateVersion}
          />
          <h3 style={{ marginTop: 18 }}>Scene prompt</h3>
          <p style={{ color: "#5f6c7b" }}>{prompt}</p>
        </section>
      </div>
    </AppShell>
  );
}

