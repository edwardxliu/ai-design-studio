import type { Asset } from "@/src/domain/types";

export function AssetPicker({ assets, label }: { assets: Asset[]; label: string }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #d9e0e7",
        borderRadius: 8,
        padding: 18
      }}
    >
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>{label}</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              alignItems: "center",
              border: "1px solid #e7ecf1",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 12px"
            }}
          >
            <span>{asset.filename}</span>
            <small style={{ color: "#5f6c7b" }}>{asset.type}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

