"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const coverVideo = "/midea-ai/midea-scroll-new.mp4";

export function CoverHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) {
      return;
    }

    const syncVideoToScroll = () => {
      if (!video.duration || !Number.isFinite(video.duration)) {
        return;
      }

      const range = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max((window.scrollY - section.offsetTop) / range, 0), 1);
      const introProgress = Math.min(progress / 0.18, 1);
      const videoProgress = Math.min(Math.max((progress - 0.18) / 0.64, 0), 1);
      const outroProgress = Math.min(Math.max((progress - 0.82) / 0.18, 0), 1);

      video.currentTime = videoProgress * video.duration;
      section.style.setProperty("--hero-progress", String(progress));
      section.style.setProperty("--intro-progress", String(introProgress));
      section.style.setProperty("--video-progress", String(videoProgress));
      section.style.setProperty("--outro-progress", String(outroProgress));
    };

    video.addEventListener("loadedmetadata", syncVideoToScroll);
    window.addEventListener("scroll", syncVideoToScroll, { passive: true });
    window.addEventListener("resize", syncVideoToScroll);
    syncVideoToScroll();

    return () => {
      video.removeEventListener("loadedmetadata", syncVideoToScroll);
      window.removeEventListener("scroll", syncVideoToScroll);
      window.removeEventListener("resize", syncVideoToScroll);
    };
  }, []);

  return (
    <section
      aria-label="Midea AI platform introduction"
      className="joby-hero-scroll"
      ref={sectionRef}
    >
      <div className="joby-hero-sticky">
        <div className="joby-video-frame">
          <video
            aria-label="Midea AI creative platform film"
            className="joby-hero-video"
            muted
            playsInline
            preload="metadata"
            ref={videoRef}
          >
            <source src={coverVideo} type="video/mp4" />
          </video>
          <div aria-hidden="true" className="joby-hero-scrim" />
        </div>

        <div aria-hidden="true" className="joby-blue-intro" />
        <div aria-hidden="true" className="joby-blue-layer">
          <div className="joby-blue-content">
            <span>Let&apos;s begin our journey of creation.</span>
          </div>
        </div>

        <nav aria-label="Cover navigation" className="midea-nav joby-hero-nav">
          <a aria-label="Explore the platform" className="joby-menu" href="#platform">
            <i />
            <i />
          </a>
          <img
            alt="Midea"
            className="midea-logo-image"
            src="/midea-ai/midea-logo-white.png"
          />
          <Link className="joby-enter" href="/studio-home">
            Enter <span aria-hidden="true">&rarr;</span>
          </Link>
        </nav>

        <div className="joby-hero-copy">
          <h1>
            Skip the noise.
            <br />
            Time to make.
          </h1>
        </div>
      </div>
    </section>
  );
}
