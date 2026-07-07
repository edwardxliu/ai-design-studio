"use client";

import { useState } from "react";
import type { ImageProviderResult } from "@/src/services/image-provider";

export function PopGenerationPanel({
  productName,
  initialHeadline,
  initialSubline,
  flatPopAssetId
}: {
  productName: string;
  initialHeadline: string;
  initialSubline: string;
  flatPopAssetId: string;
}) {
  const [headline, setHeadline] = useState(initialHeadline);
  const [subline, setSubline] = useState(initialSubline);
  const [placement, setPlacement] = useState("front panel");
  const [forceMock, setForceMock] = useState(true);
  const [status, setStatus] = useState("Ready");
  const [result, setResult] = useState<ImageProviderResult | null>(null);

  async function generateScene() {
    setStatus("Generating");
    setResult(null);
    const response = await fetch("/api/pop/generate-scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: `task-pop-${Date.now()}`,
        productName,
        placement,
        flatPopAssetId,
        country: "Mexico",
        language: "Spanish",
        forceMock
      })
    });
    const payload = await response.json();
    setResult(payload);
    setStatus(response.ok ? "Generated" : "Failed");
  }

  return (
    <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Editable POP</h2>
          <p style={{ color: "#5f6c7b", margin: 0 }}>Template text and image slots stay editable before scene generation.</p>
        </div>
        <strong style={{ color: status === "Generated" ? "#12805c" : "#5f6c7b" }}>{status}</strong>
      </div>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(260px, 360px) 1fr" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Headline
            <input value={headline} onChange={(event) => setHeadline(event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Subline
            <input value={subline} onChange={(event) => setSubline(event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            Placement
            <select value={placement} onChange={(event) => setPlacement(event.target.value)}>
              <option value="front panel">front panel</option>
              <option value="side panel">side panel</option>
              <option value="inner cavity">inner cavity</option>
              <option value="top surface">top surface</option>
            </select>
          </label>
          <label style={{ alignItems: "center", display: "flex", gap: 8 }}>
            <input checked={forceMock} onChange={(event) => setForceMock(event.target.checked)} type="checkbox" />
            Use mock fallback
          </label>
          <button onClick={generateScene} type="button">Generate Scene</button>
        </div>
        <div>
          <div style={{ background: "#111827", color: "#ffffff", minHeight: 190, padding: 18 }}>
            <p style={{ color: "#93c5fd", fontSize: 12, fontWeight: 800, margin: "0 0 18px" }}>POP PREVIEW</p>
            <h3 style={{ fontSize: 30, margin: "0 0 10px" }}>{headline}</h3>
            <p style={{ color: "#d1d5db", margin: 0 }}>{subline}</p>
          </div>
          {result ? (
            <div style={{ background: result.isFallback ? "#fff4e5" : "#e8f7f1", marginTop: 12, padding: 12 }}>
              <strong>{result.isFallback ? "Mock output" : "OpenAI output"}</strong>
              <p style={{ color: "#5f6c7b", margin: "6px 0 0" }}>{result.url}</p>
              {!result.isFallback ? <img alt="Generated POP product scene" src={result.url} style={{ marginTop: 12, maxWidth: "100%" }} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
