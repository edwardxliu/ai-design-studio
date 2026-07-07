import { AppShell } from "@/src/components/AppShell";
import { readDemoCostRecords } from "@/src/services/demo-api";

export default async function CostsPage() {
  const costRows = await readDemoCostRecords();

  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Resource Traceability</h1>
      <p style={{ color: "#5f6c7b", marginBottom: 18, maxWidth: 820 }}>
        Every generated output records task type, model, fallback state, market, language,
        source assets, and estimated usage. Live records are shown before demo baseline rows.
      </p>
      <table style={{ background: "#ffffff", borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Task", "Model", "Mode", "Country", "Language", "Units", "Sources"].map((head) => (
              <th key={head} style={{ border: "1px solid #d9e0e7", padding: 12, textAlign: "left" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costRows.map((row, index) => (
            <tr key={`${row.taskId ?? row.task}-${row.country}-${index}`}>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.task}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.model}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.mode}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.country}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.language}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.estimatedUnits}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12, color: "#5f6c7b" }}>
                {row.sourceAssetIds?.join(", ") ?? "demo baseline"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}
