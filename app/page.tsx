const metrics = [
  { label: "Product profiles", value: "2", detail: "Demo pack + upload-ready" },
  { label: "Generation tasks", value: "12", detail: "POP, PDP, localization, motion" },
  { label: "Fallback safe", value: "On", detail: "Mock output when API is unavailable" }
];

const featureLinks = [
  {
    href: "/intake",
    title: "Upload assets",
    detail: "Import product photos, POP/PDP references, brand guides, and feature images."
  },
  {
    href: "/tasks",
    title: "Task center",
    detail: "Review the generation tasks available for the current product profile."
  },
  {
    href: "/pop",
    title: "POP templates",
    detail: "Edit fixed POP templates and generate realistic POP-on-product scenes."
  },
  {
    href: "/pdp",
    title: "PDP builder",
    detail: "Create dynamic long-image PDP layouts from recognized selling points."
  },
  {
    href: "/localization",
    title: "Localization",
    detail: "Preview country and language variants for overseas product marketing."
  },
  {
    href: "/costs",
    title: "Cost ledger",
    detail: "Inspect generation records, model fallback state, and source asset traceability."
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Local Next.js Demo</p>
          <h1>Midea Overseas AI Content Studio</h1>
          <p className="lede">
            A local product-marketing workbench for intake, product profile extraction,
            POP/PDP generation, localization, and cost traceability.
          </p>
        </div>
        <div className="status-pill">localhost-ready</div>
      </section>

      <section className="metric-grid" aria-label="Demo status">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="workflow-panel">
        <h2>Start demo workflow</h2>
        <div className="feature-grid">
          {featureLinks.map((item) => (
            <a className="feature-link" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="workflow-panel">
        <h2>Core workflow</h2>
        <ol>
          <li>Upload or load demo product assets.</li>
          <li>Build a category-agnostic product profile and selling-point structure.</li>
          <li>Edit POP templates and generate realistic POP-on-product images.</li>
          <li>Create dynamic PDP long images from detected selling points.</li>
          <li>Export labeled artifacts and review model usage records.</li>
        </ol>
      </section>
    </main>
  );
}
