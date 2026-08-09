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
   The video ALWAYS plays. It is not gated on connection speed,
   Save-Data, or prefers-reduced-motion — that is a deliberate product
   decision, taken knowingly.

   Accessibility note: WCAG 2.2.2 (Pause, Stop, Hide) requires a way to
   stop motion that autoplays for more than five seconds. The transport
   button at the bottom of the hero is that mechanism, and it is why
   autoplaying unconditionally still conforms. Do not remove it.

   The 18 MB file buys visually transparent quality on footage full of
   hard cuts, which is expensive to compress — at 5 MB the uniforms
   broke into visible blocking. Its weight is still kept off the
   critical path:

     1. The poster (~220 KB) renders immediately as a CSS background,
        so the hero is complete on first paint.
     2. `preload="none"` means nothing is fetched until we ask.
     3. The source is attached just after `load`, so the video streams
        in behind the page rather than competing with it.

   So the page is usable at ~220 KB and the video arrives shortly
   after — for everyone.
===================================================================== */

const VIDEO_SRC = "/media/hero.mp4";
const POSTER = "/media/hero-poster.jpg";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // Attach the source once the page has finished loading. Unconditional
  // — every visitor gets the video.
  useEffect(() => {
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
    // Covers the brief window before the source is attached.
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

      {/* REQUIRED. The video autoplays unconditionally, so this is the
          "Pause, Stop, Hide" mechanism WCAG 2.2.2 mandates for motion
          running longer than five seconds. Removing it breaks
          conformance. */}
      <button type="button" className="pub-hero__transport" onClick={toggle}>
        <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`} aria-hidden="true" />
        <span className="sr-only">
          {playing ? "Pause background video" : "Play background video"}
        </span>
      </button>
    </>
  );
}
