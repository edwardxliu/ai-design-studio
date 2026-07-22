const executionDemos = [
  {
    body: "Reduce operational overhead as we coordinate built-in editing and refinement within the same project, removing manual handoffs and redundant steps.",
    src: "/midea-ai/execution-demo-01.mp4",
    title: "Eliminate Production Friction"
  },
  {
    body: "Increase creative throughput and decision velocity simultaneously, preserving shared context and eliminating restarts.",
    src: "/midea-ai/execution-demo-02.mp4",
    title: "Instant Ideas Execution"
  },
  {
    body: "Maintain brand and asset consistency as Luma Agents carry context from planning through final assembly, ensuring reliable, production-ready delivery.",
    src: "/midea-ai/execution-demo-03.mp4",
    title: "Deliver with Continuity at Scale"
  }
] as const;

export function ExecutionShowcaseSection() {
  return (
    <section
      aria-label="Workflow execution demos"
      className="execution-showcase-section"
      id="execution"
    >
      <div className="execution-showcase-list">
        {executionDemos.map((demo, index) => (
          <article
            className={`execution-showcase-row${index % 2 === 1 ? " is-reversed" : ""}`}
            id={index === 0 ? "details" : undefined}
            key={demo.src}
          >
            <div className="execution-showcase-visual">
              <div className="execution-showcase-video-shell">
                <video
                  aria-label={`${demo.title} demonstration`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                >
                  <source src={demo.src} type="video/mp4" />
                </video>
              </div>
            </div>

            <div className="execution-showcase-copy">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h2>{demo.title}</h2>
              <p>{demo.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}