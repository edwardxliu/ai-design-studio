import { getMissingPdpImageSlots, type PdpDocument } from "@/src/domain/pdp";

export function PdpBuilderView({
  document,
  productName
}: {
  document: PdpDocument;
  productName: string;
}) {
  const missing = getMissingPdpImageSlots(document);

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #d9e0e7",
        borderRadius: 8,
        padding: 20
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ color: "#057ca2", fontSize: 12, fontWeight: 800, margin: 0 }}>
            PDP TEMPLATE ENGINE
          </p>
          <h2 style={{ margin: "6px 0 6px" }}>Dynamic PDP Builder</h2>
          <p style={{ color: "#5f6c7b", margin: 0 }}>
            {productName} / {document.country} / {document.language}
          </p>
        </div>
        <div
          style={{
            alignSelf: "start",
            background: missing.length ? "#fff4e5" : "#e8f7f1",
            border: `1px solid ${missing.length ? "#ffd59a" : "#bfe7d5"}`,
            borderRadius: 999,
            color: missing.length ? "#9a5b00" : "#12805c",
            fontWeight: 800,
            padding: "8px 12px"
          }}
        >
          {missing.length ? `${missing.length} image needed` : "Ready to export"}
        </div>
      </div>

      <div
        style={{
          border: "1px solid #17202a",
          borderRadius: 8,
          marginTop: 18,
          overflow: "hidden"
        }}
      >
        <div style={{ background: "#17202a", color: "#ffffff", padding: 18 }}>
          <strong>{document.cover.title}</strong>
          {document.cover.subtitle ? <p style={{ margin: "6px 0 0" }}>{document.cover.subtitle}</p> : null}
        </div>
        {document.sections.map((section) => (
          <article
            key={section.id}
            style={{
              display: "grid",
              gap: 0,
              gridTemplateColumns: section.layout === "image-left" ? "2fr 1fr" : "1fr 2fr",
              minHeight: 150
            }}
          >
            <div
              style={{
                background: "#e5e8ec",
                minHeight: 150,
                order: section.layout === "image-left" ? 0 : 1,
                padding: 16
              }}
            >
              {section.largeImageAssetId ?? `Missing image: ${section.sellingPointId}`}
            </div>
            <div style={{ padding: 16 }}>
              <div
                style={{
                  background: "#111827",
                  color: "#ffffff",
                  display: "inline-block",
                  fontWeight: 800,
                  marginBottom: 10,
                  padding: "8px 12px"
                }}
              >
                {section.blackTitle}
              </div>
              <div style={{ background: "#f1f3f5", color: "#17202a", padding: "8px 12px" }}>
                {section.narrowGrayText}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

