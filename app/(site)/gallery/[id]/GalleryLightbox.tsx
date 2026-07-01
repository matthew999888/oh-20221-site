"use client";

import { useState } from "react";

type ImageDTO = { id: string; url: string; caption: string | null };

export default function GalleryLightbox({ images }: { images: ImageDTO[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null ? images[openIndex] : null;

  function go(delta: number) {
    if (openIndex === null) return;
    setOpenIndex((openIndex + delta + images.length) % images.length);
  }

  return (
    <>
      <div className="lightbox-grid">
        {images.map((img, i) => (
          <button className="lightbox-grid__item" key={img.id} onClick={() => setOpenIndex(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? ""} loading="lazy" />
            {img.caption && <span className="lightbox-grid__caption">{img.caption}</span>}
          </button>
        ))}
      </div>

      {open && (
        <div className="lightbox-overlay" role="dialog" aria-modal="true" onClick={() => setOpenIndex(null)}>
          <button className="lightbox-overlay__close" aria-label="Close" onClick={() => setOpenIndex(null)}>
            <i className="fa-solid fa-xmark" />
          </button>
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
            <img src={open.url} alt={open.caption ?? ""} />
            {open.caption && <figcaption>{open.caption}</figcaption>}
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
