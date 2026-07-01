export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";

export default async function GalleryIndexPage() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { images: true } } }
  });

  return (
    <main className="page-section">
      <h1 className="page-section__title">Gallery</h1>
      <p className="page-section__sub">Photos from drill meets, ceremonies, and unit events.</p>

      {galleries.length === 0 ? (
        <p className="content-block__empty">No galleries published yet.</p>
      ) : (
        <div className="gallery-grid">
          {galleries.map((g) => (
            <Link href={`/gallery/${g.id}`} key={g.id} className="gallery-card">
              {g.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={toDriveThumbnail(g.images[0].url, 600)} alt="" loading="lazy" />
              ) : (
                <div className="gallery-teaser__placeholder" />
              )}
              <div className="gallery-card__info">
                <h3>{g.title}</h3>
                {g.description && <p>{g.description}</p>}
                <span className="gallery-card__count">{g._count.images} photo{g._count.images === 1 ? "" : "s"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
