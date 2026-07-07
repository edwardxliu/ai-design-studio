"use client";

import { FormEvent, useRef, useState } from "react";
import type { Asset, AssetType } from "@/src/domain/types";

const assetTypes: AssetType[] = [
  "product-photo",
  "phone-shot",
  "brand-guide",
  "template-reference",
  "feature-icon",
  "background",
  "pop-input",
  "pdp-input",
  "document"
];

export function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assetType, setAssetType] = useState<AssetType>("product-photo");
  const [status, setStatus] = useState("Idle");
  const [assets, setAssets] = useState<Asset[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files?.length) {
      setStatus("Select at least one file");
      return;
    }

    const form = new FormData();
    form.append("projectId", "demo-project");
    form.append("productId", "uploaded-product");
    form.append("type", assetType);
    Array.from(files).forEach((file) => form.append("files", file));

    setStatus("Uploading");
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Upload failed");
      return;
    }

    setAssets(payload.assets ?? []);
    setStatus("Saved locally");
  }

  return (
    <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Upload Product Assets</h2>
          <p style={{ color: "#5f6c7b", margin: 0 }}>Saved to local demo storage for reuse across POP and PDP tasks.</p>
        </div>
        <strong style={{ color: status === "Saved locally" ? "#12805c" : "#5f6c7b" }}>{status}</strong>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Asset type
          <select value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)}>
            {assetTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          Files
          <input ref={fileInputRef} multiple type="file" />
        </label>
        <button type="submit" style={{ justifySelf: "start" }}>Upload</button>
      </form>
      {assets.length ? (
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {assets.map((asset) => (
            <div key={asset.id} style={{ borderTop: "1px solid #e7ecf1", paddingTop: 8 }}>
              <strong>{asset.filename}</strong>
              <p style={{ color: "#5f6c7b", margin: "4px 0 0" }}>{asset.url}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
