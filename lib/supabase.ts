import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* =====================================================================
   Supabase client
   ---------------------------------------------------------------------
   WHAT THIS IS NOT
   ----------------
   This does NOT replace `DATABASE_URL`. Prisma (lib/prisma.ts) speaks
   the raw Postgres wire protocol over TCP and authenticates with the
   database password. The keys below authenticate to Supabase's REST API
   (PostgREST), Storage, and Realtime — a completely different transport
   to the same database.

   Every query in this app goes through Prisma, so the app still cannot
   start without a working `DATABASE_URL`. Use this client for the things
   Prisma cannot do:

     - Storage (file uploads — a candidate to replace the current
       Google Drive gallery hosting)
     - Realtime subscriptions
     - Calling Supabase Edge Functions

   KEY NAMING
   ----------
   Supabase renamed its API keys. Both generations are accepted here:

     current  sb_publishable_...   /  sb_secret_...
     legacy   anon (JWT)           /  service_role (JWT)

   SECURITY
   --------
   The secret / service_role key BYPASSES ROW LEVEL SECURITY entirely.
   It is a full-access database credential. It must never reach the
   browser, which is why it is read from a non-`NEXT_PUBLIC_` variable
   and guarded at runtime below. The publishable / anon key is safe to
   expose — it is designed to ship in client bundles and is only useful
   in combination with RLS policies.
===================================================================== */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Accept either naming generation, current first.
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);

/**
 * Browser-safe client. Subject to Row Level Security, so it can only
 * read what your RLS policies allow. Safe to call from Client
 * Components.
 *
 * Returns null when unconfigured rather than throwing, so a missing key
 * degrades a feature instead of crashing a page render.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!url || !publishableKey) return null;
  return createClient(url, publishableKey, {
    auth: {
      // Sessions are handled by NextAuth, not Supabase Auth. Persisting
      // a second session here would write stray tokens to localStorage
      // and confuse nothing but future readers.
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * Full-access server client. BYPASSES RLS.
 *
 * Server-side only — never import this into a Client Component or
 * anything reachable from one.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  // Belt and braces: if this ever gets bundled into the browser, fail
  // loudly rather than leak a full-access credential.
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseAdminClient() was called in the browser. The secret key " +
        "bypasses Row Level Security and must never reach client code."
    );
  }

  if (!url || !secretKey) return null;

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
