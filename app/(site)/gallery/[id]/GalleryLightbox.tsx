"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ImageDTO = { id: string; thumbUrl: string; fullUrl: string; caption: string | null };

const PAGE_SIZE = 30;

export default function GalleryLightbox({ images }: { images: ImageDTO[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(Math.min(PAGE_SIZE, images.length));
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Remembers which thumbnail opened the dialog so focus can return
  // there on close instead of jumping to the top of the document.
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

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

  const close = useCallback(() => {
    setOpenIndex(null);
    lastTriggerRef.current?.focus();
  }, []);

  // Keyboard handling for the open dialog: arrows navigate, Escape
  // closes, and Tab is trapped inside the dialog (WCAG 2.1.2 No Keyboard
  // Trap requires a way out — Escape — and 2.4.3 requires focus stay in
  // the modal while it is open).
  useEffect(() => {
    if (openIndex === null) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      } else if (e.key === "Escape") {
        close();
      } else if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openIndex, go, close]);

  // Move focus into the dialog when it opens, and stop the page behind
  // it from scrolling.
  useEffect(() => {
    if (openIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex]);

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
          <button
            className="lightbox-grid__item"
            key={img.id}
            onClick={(e) => {
              lastTriggerRef.current = e.currentTarget;
              setOpenIndex(i);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.thumbUrl} alt="" loading="lazy" />
            {img.caption && <span className="lightbox-grid__caption">{img.caption}</span>}
            {/* Always give the button a name — a caption-less photo would
                otherwise be an unlabeled button to a screen reader. */}
            <span className="sr-only">
              {img.caption
                ? `View photo: ${img.caption}`
                : `View photo ${i + 1} of ${images.length}`}
            </span>
          </button>
        ))}
      </div>

      {visibleCount < images.length && (
        <button
          className="pub-btn pub-btn--quiet"
          style={{ marginTop: "1.5rem" }}
          onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, images.length))}
        >
          Load more photos ({images.length - visibleCount} remaining)
        </button>
      )}

      {open && openIndex !== null && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${openIndex + 1} of ${images.length}${
            open.caption ? `: ${open.caption}` : ""
          }`}
          ref={dialogRef}
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lightbox-overlay__close" onClick={close}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
            <span className="sr-only">Close photo viewer</span>
          </button>

          <span className="lightbox-overlay__counter" aria-hidden="true">
            {openIndex + 1} / {images.length}
          </span>

          <button
            className="lightbox-overlay__nav lightbox-overlay__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            <span className="sr-only">Previous photo</span>
          </button>

          <figure className="lightbox-overlay__figure" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.fullUrl} alt={open.caption ?? `Photo ${openIndex + 1}`} />
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
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </figure>

          <button
            className="lightbox-overlay__nav lightbox-overlay__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            <span className="sr-only">Next photo</span>
          </button>
        </div>
      )}
    </>
  );
}
