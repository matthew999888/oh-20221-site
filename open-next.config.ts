import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext adapter config — turns the Next.js build into a Cloudflare
 * Worker.
 *
 * Caching is deliberately left at the in-memory default. Wiring the R2
 * incremental cache is the documented next step once the app is
 * actually serving traffic, but it needs an R2 bucket binding and this
 * site is almost entirely `force-dynamic` (every page hits Postgres),
 * so an ISR cache would sit unused today.
 *
 * To enable it later:
 *   import r2Cache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
 *   export default defineCloudflareConfig({ incrementalCache: r2Cache });
 * ...plus an `r2_buckets` entry in wrangler.jsonc.
 */
export default defineCloudflareConfig();
