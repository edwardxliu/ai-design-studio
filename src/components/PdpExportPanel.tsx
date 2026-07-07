"use client";

import { useState } from "react";

type PdpExportResult = {
  taskId: string;
  url: string;
  templateVersion: string;
  sectionCount: number;
  isFallback: boolean;
};

export function PdpExportPanel() {
  const [country, setCountry] = useState("Mexico");
  const [language, setLanguage] = useState("Spanish");
  const [status, setStatus] = useState("Ready");
  const [result, setResult] = useState<PdpExportResult | null>(null);

  async function exportLongImage() {
    setStatus("Exporting");
    setResult(null);
    const response = await fetch("/api/pdp/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: `task-pdp-export-${Date.now()}`,
        country,
        language
      })
    });
    const payload = await response.json();
    setResult(payload);
    setStatus(response.ok ? "Exported" : "Failed");
  }

  return (
    <section style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, marginTop: 18, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Long Image Export</h2>
          <p style={{ color: "#5f6c7b", margin: 0 }}>Exports the current dynamic PDP as a single screenshot-like SVG image.</p>
        </div>
        <strong style={{ color: status === "Exported" ? "#12805c" : "#5f6c7b" }}>{status}</strong>
      </div>
      <div style={{ alignItems: "end", display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <label style={{ display: "grid", gap: 6 }}>
          Country
          <input value={country} onChange={(event) => setCountry(event.target.value)} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          Language
          <input value={language} onChange={(event) => setLanguage(event.target.value)} />
        </label>
        <button onClick={exportLongImage} type="button">Export PDP</button>
      </div>
      {result ? (
        <div style={{ background: "#e8f7f1", marginTop: 14, padding: 12 }}>
          <strong>{result.templateVersion} / {result.sectionCount} sections</strong>
          <p style={{ color: "#5f6c7b", margin: "6px 0 12px" }}>{result.url}</p>
          <img alt="Exported PDP long image" src={result.url} style={{ border: "1px solid #d9e0e7", maxWidth: "100%" }} />
        </div>
      ) : null}
    </section>
  );
}
