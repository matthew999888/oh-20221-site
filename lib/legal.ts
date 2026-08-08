/* =====================================================================
   Shared constants for the legal / compliance pages.
   ---------------------------------------------------------------------
   Keeping these in one place means a contact change or a policy revision
   updates every page at once, and the "last updated" dates can't drift
   apart between /privacy, /terms, and /accessibility.
===================================================================== */

/** Bump when the substance of a policy changes, not for typo fixes. */
export const POLICY_LAST_UPDATED = "August 8, 2026";

export const UNIT = {
  designation: "OH-20221",
  program: "Air Force Junior Reserve Officer Training Corps (AFJROTC)",
  school: "Logan High School",
  district: "Logan-Hocking Local School District",
  address: {
    street: "14470 State Route 328",
    city: "Logan",
    state: "OH",
    zip: "43138"
  }
} as const;

export const CONTACTS = {
  sasi: { name: "Maj Lance Roberts", title: "SASI", email: "lroberts@lhsd.k12.oh.us" },
  asi: { name: "MSgt Jeffery George", title: "ASI", email: "jgeorge@lhsd.k12.oh.us" }
} as const;

/**
 * Third parties that receive data as a result of someone using this site.
 * Every entry here must be reflected in the Privacy Policy's disclosure
 * table — if you add a service to the stack, add it here first.
 */
export const SUBPROCESSORS = [
  {
    name: "Supabase",
    purpose: "PostgreSQL database hosting — stores all site and portal content",
    data: "Account details, cadet records, and site content"
  },
  {
    name: "Cloudflare",
    purpose: "Application hosting, network security, and Turnstile bot verification",
    data: "IP address, request metadata, and browser characteristics"
  },
  {
    name: "Upstash",
    purpose: "Rate-limit counters that protect sign-in and submission endpoints from abuse",
    data: "A hashed identifier derived from IP address, plus request counts"
  },
  {
    name: "Google (Drive & Fonts)",
    purpose: "Photo gallery image hosting and web font delivery",
    data: "IP address and browser characteristics when images or fonts load"
  }
] as const;
