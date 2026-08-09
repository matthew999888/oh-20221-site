"use client";

import { useEffect, useRef, useState } from "react";

/* =====================================================================
   Hero background video
   ---------------------------------------------------------------------
   To replace the footage, overwrite these files — no code change:

     public/media/hero.mp4          H.264, 16:9
     public/media/hero-poster.jpg   16:9 still

   See public/media/README.md for the ffmpeg commands used, and for why
   there is deliberately no WebM.

   LOADING STRATEGY
   ----------------
   The current file is 18 MB. That buys visually transparent quality on
   footage full of hard cuts, which is expensive to compress — at 5 MB
   the uniforms broke into visible blocking. Rather than trade the
   quality back, the cost is managed by never making anyone wait for it:

     1. The poster (~220 KB) renders immediately as a CSS background,
        so the hero is complete on first paint.
     2. `preload="none"` means the browser fetches nothing until asked.
     3. The source is attached only after `load`, so the video never
        competes with page content for bandwidth.
     4. Visitors on a metered or slow connection, or with "reduce
        motion" set, keep the poster and never download the video.

   The result: the page costs ~220 KB whatever happens, and the video is
   a progressive enhancement for connections that can absorb it.
===================================================================== */

const VIDEO_SRC = "/media/hero.mp4";
const POSTER = "/media/hero-poster.jpg";

type Connection = { saveData?: boolean; effectiveType?: string };

/** True when downloading 18 MB of decoration would be inconsiderate. */
function shouldSkipVideo(): boolean {
  if (typeof window === "undefined") return true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

  const conn = (navigator as Navigator & { connection?: Connection }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /(^|-)(2g|3g)$/.test(conn.effectiveType)) return true;

  return false;
}

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // Attach the source only once the page has finished loading, and only
  // if this connection should have it at all.
  useEffect(() => {
    if (shouldSkipVideo()) return;

    let cancelled = false;
    const start = () => {
      if (!cancelled) setSrc(VIDEO_SRC);
    };

    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", start);
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // Autoplay once a source exists. `autoPlay` alone is unreliable when
  // src is attached after mount, and Safari can reject the first
  // attempt — a rejected promise is expected and must not throw.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    void video.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }, [src]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    // Lets someone who was skipped by the heuristics opt in deliberately.
    if (!src) {
      setSrc(VIDEO_SRC);
      return;
    }
    if (video.paused) {
      void video.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      {/* The poster is a background image rather than the <video
          poster> attribute, so it paints even before the element has a
          source — and remains the backdrop if the video never loads. */}
      <div
        className="pub-hero__media"
        style={{
          backgroundImage: `url(${POSTER})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <video
          ref={videoRef}
          className="pub-hero__video"
          // Decorative: it carries nothing the surrounding copy does
          // not, so it is hidden from assistive tech and the tab order.
          aria-hidden="true"
          tabIndex={-1}
          muted
          loop
          playsInline
          preload="none"
          poster={POSTER}
          src={src ?? undefined}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={{ opacity: playing ? 1 : 0, transition: "opacity 700ms ease" }}
        />
      </div>

      <div className="pub-hero__scrim" aria-hidden="true" />

      {/* Required for motion that autoplays and runs past 5s
          (WCAG 2.2.2). Also the opt-in for anyone the loading
          heuristics skipped. */}
      <button type="button" className="pub-hero__transport" onClick={toggle}>
        <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`} aria-hidden="true" />
        <span className="sr-only">
          {playing ? "Pause background video" : "Play background video"}
        </span>
      </button>
    </>
  );
}
