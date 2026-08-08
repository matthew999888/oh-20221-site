import { PrismaClient } from "@prisma/client";

/* =====================================================================
   Prisma client
   ---------------------------------------------------------------------
   Two execution environments, one client:

   - Node (local dev, `next dev`, `next build`, migrations, seeding):
     the default Prisma query engine talks to Postgres directly.

   - Cloudflare Workers: the default engine is a native binary and
     cannot run there. Workers instead uses the `@prisma/adapter-pg`
     driver adapter, which speaks Postgres over the TCP sockets that
     `nodejs_compat` provides.

   The branch is on `process.env.NEXT_RUNTIME`/Workers detection rather
   than a build flag so the same source works in both places.
   ===================================================================== */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * True when running inside a Cloudflare Worker. `WebSocketPair` is a
 * Workers-only global, which makes it a reliable marker — checking for
 * the absence of `process` is not, because `nodejs_compat` provides one.
 */
function isCloudflareWorkers(): boolean {
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined";
}

function createClient(): PrismaClient {
  const log: ("query" | "error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

  if (isCloudflareWorkers()) {
    // Required by @prisma/adapter-pg. Imported lazily so the Node path
    // never pulls `pg` into the bundle.
    //
    // NOTE: this needs `previewFeatures = ["driverAdapters"]` on the
    // generator block in prisma/schema.prisma.
    //
    /* eslint-disable @typescript-eslint/no-var-requires */
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const { Pool } = require("pg") as typeof import("pg");
    /* eslint-enable @typescript-eslint/no-var-requires */

    // Prisma 5.x's adapter takes a pg.Pool instance. (Prisma 6.6+ accepts
    // a plain `{ connectionString }` config — update this if you upgrade.)
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // One connection per isolate. Workers isolates are short-lived and
      // numerous; a larger pool per isolate would exhaust Postgres'
      // connection limit. DATABASE_URL must point at Supabase's
      // transaction-mode pooler (port 6543) for this to hold up.
      max: 1
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
