import { AppShell } from "@/src/components/AppShell";

const tasks = [
  "White background multi-angle output",
  "Phone shot to studio product image",
  "SKU local replacement",
  "Style transfer",
  "POP template and product-scene generation",
  "Dynamic PDP long image",
  "Country and language variants",
  "Motion storyboard"
];

export default function TasksPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: 30, marginBottom: 18 }}>AI Task Center</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {tasks.map((task, index) => (
          <article
            key={task}
            style={{
              background: "#ffffff",
              border: "1px solid #d9e0e7",
              borderRadius: 8,
              padding: 16
            }}
          >
            <strong>{index + 1}. {task}</strong>
            <p style={{ color: "#5f6c7b", margin: "6px 0 0" }}>
              Ready for mock generation and later OpenAI-backed execution.
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

