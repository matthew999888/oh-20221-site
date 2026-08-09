"use client";

import { useId, useMemo, useState } from "react";
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
  const searchId = useId();

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
        <div className="pub-filters">
          <div className="pub-field" style={{ flex: "0 1 360px" }}>
            <label className="pub-field__label" htmlFor={searchId}>
              Search galleries
            </label>
            <input
              id={searchId}
              type="search"
              className="pub-input"
              placeholder="Album name or description…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {galleries.length > 4 && (
        <p className="pub-result-count" role="status" aria-live="polite">
          {query.trim()
            ? `Showing ${filtered.length} of ${galleries.length} albums`
            : `${galleries.length} albums`}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="pub-empty">No galleries match “{query}”.</p>
      ) : (
        <div className="pub-gallery-grid">
          {filtered.map((g) => (
            <Link href={`/gallery/${g.id}`} key={g.id} className="pub-gallery-card">
              {g.coverUrl ? (
                // Decorative: the album title below is the accessible name
                // for this link, so alt text here would be redundant noise.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.coverUrl} alt="" loading="lazy" />
              ) : (
                <span className="pub-gallery-card__placeholder" />
              )}
              <span className="pub-gallery-card__label">
                {g.title}
                <span className="pub-gallery-card__count">
                  {g.photoCount} photo{g.photoCount === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
