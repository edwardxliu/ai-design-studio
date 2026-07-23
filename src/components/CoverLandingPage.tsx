"use client";

import Link from "next/link";
import { BrandSourceSection } from "./BrandSourceSection";
import { ExecutionShowcaseSection } from "./ExecutionShowcaseSection";
import { CoverChat } from "./CoverChat";
import { CoverHero } from "./CoverHero";

export function CoverLandingPage() {
  return (
    <main className="midea-draft">
      <CoverHero />

      <section className="cover-agent-section" id="platform">
        <div className="cover-agent-inner">
          <nav aria-label="Landing page sections" className="brand-collage-nav">
            <a href="#agent">Agent</a>
            <a href="#tutorial">Tutorial</a>
            <a href="#details">More Details</a>
            <Link className="brand-collage-enter" href="/studio-home">
              Enter Studio
            </Link>
          </nav>
          <CoverChat />
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
            Start now
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
