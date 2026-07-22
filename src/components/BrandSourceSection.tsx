import Link from "next/link";

export function BrandSourceSection() {
  return (
    <section
      aria-labelledby="brand-source-title"
      className="brand-source-section"
      id="workflow"
    >
      <div className="brand-source-copy">
        <h2 id="brand-source-title">Where ideas become the work</h2>
        <p>
          Learn more about how to use this platform. Start creating excellence in
          the palm of your hand
        </p>
        <Link className="brand-source-cta" href="/studio-home">
          Start Now
        </Link>
      </div>

      <div className="brand-source-video-frame">
        <video
          aria-label="Platform introduction video"
          autoPlay
          className="brand-source-video"
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src="/midea-ai/brand-source-hero.mp4" type="video/mp4" />
        </video>
      </div>
    </section>
  );
}