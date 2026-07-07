import { AppShell } from "@/src/components/AppShell";

const costRows = [
  { task: "POP scene", model: "gpt-image-2", mode: "mock fallback", country: "Mexico", language: "Spanish" },
  { task: "PDP render", model: "template-engine", mode: "deterministic", country: "Mexico", language: "Spanish" },
  { task: "Localization", model: "rules + future LLM", mode: "mock fallback", country: "Brazil", language: "Portuguese" }
];

export default function CostsPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 18 }}>Resource Traceability</h1>
      <table style={{ background: "#ffffff", borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Task", "Model", "Mode", "Country", "Language"].map((head) => (
              <th key={head} style={{ border: "1px solid #d9e0e7", padding: 12, textAlign: "left" }}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {costRows.map((row) => (
            <tr key={`${row.task}-${row.country}`}>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.task}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.model}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.mode}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.country}</td>
              <td style={{ border: "1px solid #d9e0e7", padding: 12 }}>{row.language}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}

