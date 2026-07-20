export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article
      style={{
        background: "var(--studio-glass-card, #ffffff)",
        border: "1px solid #d9e0e7",
        borderRadius: 8,
        padding: 18
      }}
    >
      <div style={{ color: "#5f6c7b", fontSize: 13 }}>{label}</div>
      <strong style={{ display: "block", fontSize: 28, margin: "8px 0" }}>{value}</strong>
      <p style={{ color: "#5f6c7b", margin: 0 }}>{detail}</p>
    </article>
  );
}

