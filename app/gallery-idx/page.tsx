export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";
import GalleryIndexClient from "./GalleryIndexClient";

export default async function GalleryIndexPage() {
  const galleries = await prisma.gallery.findMany({
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { images: true } } }
  });

  const galleryDTOs = galleries.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    coverUrl: g.images[0] ? toDriveThumbnail(g.images[0].url, 600) : null,
    photoCount: g._count.images
  }));

  return (
    <main className="page-section">
      <h1 className="page-section__title">Gallery</h1>
      <p className="page-section__sub">Photos from drill meets, ceremonies, and unit events.</p>

      {galleries.length === 0 ? (
        <p className="content-block__empty">No galleries published yet.</p>
      ) : (
        <GalleryIndexClient galleries={galleryDTOs} />
      )}
    </main>
  );
}
