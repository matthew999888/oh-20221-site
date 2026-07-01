import { prisma } from "@/lib/prisma";
import type { PageKey } from "@/lib/permissions";

export type ContentBlockWithBoxes = Awaited<ReturnType<typeof getContentBlock>>;

/**
 * Fetches the ContentBlock for a given page key, creating an empty
 * placeholder (title/description supplied by the caller, zero boxes) the
 * first time a page is visited so editors always have something to edit
 * rather than a null state.
 */
export async function getContentBlock(key: PageKey, defaults: { title: string; description?: string }) {
  const existing = await prisma.contentBlock.findUnique({
    where: { key },
    include: { boxes: { orderBy: { order: "asc" } } }
  });

  if (existing) return existing;

  return prisma.contentBlock.create({
    data: {
      key,
      title: defaults.title,
      description: defaults.description ?? null
    },
    include: { boxes: { orderBy: { order: "asc" } } }
  });
}
