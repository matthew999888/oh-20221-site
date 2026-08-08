export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";
import PageHeader from "../../PageHeader";
import GalleryLightbox from "./GalleryLightbox";

// Next 15: `params` is a Promise and must be awaited.
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    select: { title: true, description: true }
  });
  if (!gallery) return { title: "Gallery not found" };
  return {
    title: gallery.title,
    description: gallery.description ?? `Photos from ${gallery.title} — OH-20221 AFJROTC.`
  };
}

export default async function GalleryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } }
  });

  if (!gallery) notFound();

  // Small thumbnail for the grid tile, full-resolution image loaded only
  // when that photo is actually opened in the lightbox — keeps the grid
  // itself light on mobile data.
  const images = gallery.images.map((img) => ({
    id: img.id,
    thumbUrl: toDriveThumbnail(img.url, 420),
    fullUrl: toDriveThumbnail(img.url, 1600),
    caption: img.caption
  }));

  return (
    <>
      <PageHeader
        eyebrow="Photo Album"
        title={gallery.title}
        lede={gallery.description ?? undefined}
        crumbs={[{ href: "/gallery", label: "Gallery" }]}
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          {images.length === 0 ? (
            <p className="pub-empty">No photos in this gallery yet.</p>
          ) : (
            <GalleryLightbox images={images} />
          )}
        </div>
      </div>
    </>
  );
}
