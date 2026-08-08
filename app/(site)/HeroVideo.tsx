"use client";

import { useEffect, useRef, useState } from "react";

/* =====================================================================
   Hero background video
   ---------------------------------------------------------------------
   DROP YOUR VIDEO IN HERE — no code changes needed:

     public/media/hero.mp4      H.264/AAC, 16:9, required
     public/media/hero.webm     VP9, 16:9, optional but recommended
     public/media/hero-poster.jpg   16:9 still, shown before/instead
                                    of the video

   Until those files exist the hero falls back to the gradient plane in
   `.pub-hero__media`, so the page looks intentional rather than broken.

   Encoding notes for a background loop:
     - 16:9, 1920x1080 is plenty; 2560x1440 if the footage is detailed.
     - Target 6-10s and cut on a matching frame so the loop is seamless.
     - No audio track at all (smaller file, and it can never unmute).
     - Aim under ~4 MB; this autoplays for every first-time visitor.
     - Keep the subject centered — the video is `object-fit: cover`, so
       the left/right edges crop away on narrow viewports.
       ffmpeg -i in.mov -an -c:v libx264 -crf 26 -vf scale=1920:-2 \
         -movflags +faststart public/media/hero.mp4
===================================================================== */

const SOURCES = [
  { src: "/media/hero.webm", type: "video/webm" },
  { src: "/media/hero.mp4", type: "video/mp4" }
];
const POSTER = "/media/hero-poster.jpg";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // `null` = we don't yet know whether a video file exists. The transport
  // control stays hidden until a frame decodes, so the button never
  // appears over a still gradient with nothing to pause.
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyMotionPreference = () => {
      if (reduceMotion.matches) {
        // Respect the OS setting: hold on the first frame instead of
        // looping. The user can still start it from the transport button.
        video.pause();
        setPlaying(false);
      } else {
        // `autoPlay` covers most cases, but Safari/iOS can reject the
        // initial attempt; retrying here catches that. A rejected promise
        // is expected (e.g. battery saver) and must not throw.
        void video.play().then(
          () => setPlaying(true),
          () => setPlaying(false)
        );
      }
    };

    applyMotionPreference();
    reduceMotion.addEventListener("change", applyMotionPreference);
    return () => reduceMotion.removeEventListener("change", applyMotionPreference);
  }, [hasVideo]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
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
      <div className="pub-hero__media">
        <video
          ref={videoRef}
          className="pub-hero__video"
          // Decorative background footage: it carries no information the
          // surrounding copy doesn't, so it's hidden from assistive tech
          // and taken out of the tab order.
          aria-hidden="true"
          tabIndex={-1}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          onLoadedData={() => setHasVideo(true)}
          onError={() => setHasVideo(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          {SOURCES.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      </div>

      <div className="pub-hero__scrim" aria-hidden="true" />

      {hasVideo && (
        <button type="button" className="pub-hero__transport" onClick={toggle}>
          <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`} aria-hidden="true" />
          <span className="sr-only">
            {playing ? "Pause background video" : "Play background video"}
          </span>
        </button>
      )}
    </>
  );
}
