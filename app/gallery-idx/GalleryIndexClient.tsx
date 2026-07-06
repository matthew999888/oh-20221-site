"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type GalleryDTO = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  photoCount: number;
};

export default function GalleryIndexClient({ galleries }: { galleries: GalleryDTO[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return galleries;
    return galleries.filter(
      (g) => g.title.toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q)
    );
  }, [galleries, query]);

  return (
    <>
      {galleries.length > 4 && (
        <div className="form-group" style={{ maxWidth: "360px", marginTop: "1rem" }}>
          <input
            type="search"
            className="form-input"
            placeholder="Search galleries…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search galleries"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="content-block__empty">No galleries match "{query}".</p>
      ) : (
        <div className="gallery-grid">
          {filtered.map((g) => (
            <Link href={`/gallery/${g.id}`} key={g.id} className="gallery-card">
              {g.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.coverUrl} alt="" loading="lazy" />
              ) : (
                <div className="gallery-teaser__placeholder" />
              )}
              <div className="gallery-card__info">
                <h3>{g.title}</h3>
                {g.description && <p>{g.description}</p>}
                <span className="gallery-card__count">
                  {g.photoCount} photo{g.photoCount === 1 ? "" : "s"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
