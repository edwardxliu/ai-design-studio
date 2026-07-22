"use client";

import Link from "next/link";
import { useEffect, useRef, type PointerEvent } from "react";
import { BrandSourceSection } from "./BrandSourceSection";
import { ExecutionShowcaseSection } from "./ExecutionShowcaseSection";
import { CoverChat } from "./CoverChat";
import { CoverHero } from "./CoverHero";

const brandFloatingAssets = Array.from(
  { length: 16 },
  (_, index) => `/midea-ai/brand-reference/floating-${String(index + 1).padStart(2, "0")}.png`
);

export function CoverLandingPage() {
  const brandSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateBrandScroll = () => {
      const element = brandSectionRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const range = Math.max(1, element.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / range));
      element.style.setProperty("--brand-scroll", String(progress));

      element.querySelectorAll<HTMLElement>(".brand-float").forEach((tile, index) => {
        const stagger = (index % 4) * 0.035;
        const localProgress = Math.min(1, Math.max(0, (progress - stagger) / (1 - stagger)));
        const phase = (index / brandFloatingAssets.length) * Math.PI * 2;
        const angle = phase + localProgress * Math.PI * 1.2;
        const radius = 480 - Math.sin(localProgress * Math.PI) * 330;
        const depth = Math.sin(localProgress * Math.PI) * 220 + Math.cos(angle) * 90;

        tile.style.setProperty("--brand-orbit-x", `${Math.cos(angle) * radius}px`);
        tile.style.setProperty("--brand-orbit-y", `${Math.sin(angle) * radius * 0.68}px`);
        tile.style.setProperty("--brand-orbit-z", `${depth}px`);
        tile.style.setProperty("--brand-orbit-scale", String(1 + depth / 2600));
      });
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateBrandScroll);
    };

    updateBrandScroll();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  const updateBrandPointer = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--brand-x",
      String((event.clientX - bounds.left) / bounds.width - 0.5)
    );
    event.currentTarget.style.setProperty(
      "--brand-y",
      String((event.clientY - bounds.top) / bounds.height - 0.5)
    );
  };

  return (
    <main className="midea-draft">
      <CoverHero />
      <CoverChat />

      <section
        className="midea-platform brand-platform"
        id="platform"
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--brand-x", "0");
          event.currentTarget.style.setProperty("--brand-y", "0");
        }}
        onPointerMove={updateBrandPointer}
        ref={brandSectionRef}
      >
        <div className="brand-collage brand-floating-collage">
          <div className="brand-collage-nav">
            <span>Product</span>
            <span>Solutions</span>
            <span>Security</span>
            <span>Company</span>
            <span>Careers</span>
            <span>Blog</span>
            <span className="brand-collage-login">Log in</span>
            <Link href="/studio-home">Enter studio</Link>
          </div>
          <img
            alt="brand.ai"
            className="brand-collage-logo"
            src="/midea-ai/brand-reference/brand-logo.png"
          />
          <div
            aria-label="brand.ai floating reference collage"
            className="brand-floating-grid"
          >
            {brandFloatingAssets.map((src, index) => (
              <div className={`brand-float brand-float-${index + 1}`} key={src}>
                <div className="brand-float-inner">
                  <img alt="" src={src} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BrandSourceSection />
      <ExecutionShowcaseSection />

      <section className="midea-finale" id="start">
        <div className="midea-finale-scene">
          <img
            alt="Sunlit city plaza"
            className="midea-finale-image"
            src="/midea-ai/midea-finale-city.png"
          />
          <div className="midea-finale-sun" />
          <div className="midea-building building-a" />
          <div className="midea-building building-b" />
          <div className="midea-finale-path" />
        </div>
        <div className="midea-finale-copy">
          <p className="midea-kicker">Your next move</p>
          <h2>Start with a signal.</h2>
          <Link className="midea-start-button dark-button" href="/studio-home">
            Start now <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="midea-final-meta">
          <span>MIDEA AI PLATFORM</span>
          <span>02 / 2026</span>
        </div>
      </section>
    </main>
  );
}
