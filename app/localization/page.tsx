import { AppShell } from "@/src/components/AppShell";
import { demoProject } from "@/src/domain/demo-data";

export default function LocalizationPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 18 }}>Localization Variants</h1>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {demoProject.targetCountries.map((country, index) => (
          <article key={country} style={{ background: "#ffffff", border: "1px solid #d9e0e7", borderRadius: 8, padding: 18 }}>
            <strong>{country}</strong>
            <p style={{ color: "#5f6c7b" }}>
              Language: {demoProject.targetLanguages[index] ?? "English"}
            </p>
            <p style={{ color: "#5f6c7b", margin: 0 }}>
              Selling-point order and image text can be adjusted per market.
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

