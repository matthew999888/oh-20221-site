"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ImageDTO = { id: string; thumbUrl: string; fullUrl: string; caption: string | null };

const PAGE_SIZE = 30;

export default function GalleryLightbox({ images }: { images: ImageDTO[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(Math.min(PAGE_SIZE, images.length));
  const touchStartX = useRef<number | null>(null);

  const open = openIndex !== null ? images[openIndex] : null;

  const go = useCallback(
    (delta: number) => {
      setOpenIndex((prev) => {
        if (prev === null) return prev;
        return (prev + delta + images.length) % images.length;
      });
    },
    [images.length]
  );

  // Keyboard navigation: arrows to move, Escape to close.
  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") setOpenIndex(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openIndex, go]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  const visibleImages = images.slice(0, visibleCount);

  return (
    <>
      <div className="lightbox-grid">
        {visibleImages.map((img, i) => (
          <button className="lightbox-grid__item" key={img.id} onClick={() => setOpenIndex(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.thumbUrl} alt={img.caption ?? ""} loading="lazy" />
            {img.caption && <span className="lightbox-grid__caption">{img.caption}</span>}
          </button>
        ))}
      </div>

      {visibleCount < images.length && (
        <button
          className="btn-ghost"
          style={{ marginTop: "1.5rem" }}
          onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, images.length))}
        >
          Load more photos ({images.length - visibleCount} remaining)
        </button>
      )}

      {open && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lightbox-overlay__close" aria-label="Close" onClick={() => setOpenIndex(null)}>
            <i className="fa-solid fa-xmark" />
          </button>

          <span className="lightbox-overlay__counter">
            {(openIndex ?? 0) + 1} / {images.length}
          </span>

          <button
            className="lightbox-overlay__nav lightbox-overlay__nav--prev"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <figure className="lightbox-overlay__figure" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.fullUrl} alt={open.caption ?? ""} />
            {open.caption && <figcaption>{open.caption}</figcaption>}
            <a
              className="lightbox-overlay__download"
              href={open.fullUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fa-solid fa-download" aria-hidden="true" /> Download
            </a>
          </figure>

          <button
            className="lightbox-overlay__nav lightbox-overlay__nav--next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}
    </>
  );
}
