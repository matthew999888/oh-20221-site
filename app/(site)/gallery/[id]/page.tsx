export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";
import GalleryLightbox from "./GalleryLightbox";

export default async function GalleryDetailPage({ params }: { params: { id: string } }) {
  const gallery = await prisma.gallery.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" } } }
  });

  if (!gallery) notFound();

  const images = gallery.images.map((img) => ({
    id: img.id,
    url: toDriveThumbnail(img.url, 1400),
    caption: img.caption
  }));

  return (
    <main className="page-section">
      <Link href="/gallery" className="back-link">
        <i className="fa-solid fa-arrow-left" /> All galleries
      </Link>
      <h1 className="page-section__title">{gallery.title}</h1>
      {gallery.description && <p className="page-section__sub">{gallery.description}</p>}

      {images.length === 0 ? (
        <p className="content-block__empty">No photos in this gallery yet.</p>
      ) : (
        <GalleryLightbox images={images} />
      )}
    </main>
  );
}
