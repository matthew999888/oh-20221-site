import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loganjrotc.org";

/**
 * robots.txt
 *
 * The disallow list is a crawling instruction, NOT a security control —
 * everything under /dashboard and /admin is already gated by
 * middleware.ts and by per-page permission checks. This just keeps
 * private surfaces out of search results and stops crawlers wasting
 * requests on pages that only ever return a login redirect.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/", // cadet portal
          "/admin/", // staff administration
          "/api/", // JSON endpoints
          "/login",
          "/signup",
          "/waiting-approval"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
