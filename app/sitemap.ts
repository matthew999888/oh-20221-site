import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { listDepartmentRoles, listLdrRoles } from "@/lib/org";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loganjrotc.org";

// Regenerated hourly rather than per request: the set of public URLs
// changes when a gallery is published, not by the minute, and a crawler
// hitting this should not trigger four database queries every time.
export const revalidate = 3600;

/**
 * sitemap.xml
 *
 * Public pages only. Anything behind authentication is deliberately
 * absent — listing it would just point crawlers at login redirects.
 *
 * `lastModified` uses real record timestamps where we have them, which
 * is what makes the hint useful; inventing a date would train crawlers
 * to ignore it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/announcements`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/calendar`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/gallery`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/roster`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/dept`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/ldr`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/accessibility`, changeFrequency: "yearly", priority: 0.3 }
  ];

  try {
    const [galleries, departments, ldrs] = await Promise.all([
      prisma.gallery.findMany({ select: { id: true, updatedAt: true } }),
      listDepartmentRoles(),
      listLdrRoles()
    ]);

    return [
      ...staticRoutes,
      ...galleries.map((g) => ({
        url: `${SITE_URL}/gallery/${g.id}`,
        lastModified: g.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5
      })),
      ...departments.map((d) => ({
        url: `${SITE_URL}/dept/${d.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.4
      })),
      ...ldrs.map((l) => ({
        url: `${SITE_URL}/ldr/${l.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.4
      }))
    ];
  } catch (err) {
    // A database blip should degrade the sitemap to its static routes,
    // not return a 500. A partial sitemap is far better than none.
    console.error("[sitemap] could not load dynamic routes:", err);
    return staticRoutes;
  }
}
