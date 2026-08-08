# AFJROTC Unit Site — Foundation Scaffold

Next.js 15 (App Router, TypeScript) + React 19 + Prisma (Postgres) +
NextAuth (credentials). Deploys to **Vercel** — see "Where this deploys".

## What's included

- `prisma/schema.prisma` — full schema: `User`, `Role`, `UserRole`,
  `ContentBlock`, `Announcement`, `ReactionOption`, `ReactionVote`,
  `GuideLink`, `RosterEntry`, `InventoryItem`, `CalendarEvent`, `Gallery`,
  `GalleryImage`, `ActivityLog`.
- `prisma/seed.ts` — seeds `Unassigned`, `Basic Cadet`, `Admin`, your 18
  department roles, and your 13 LDR roles. Optionally creates a first admin
  user if `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are set.
- `lib/auth.ts` + `app/api/auth/[...nextauth]/route.ts` — NextAuth
  credentials provider verifying `User.passwordHash` via
  `lib/password.ts` (PBKDF2; legacy bcrypt hashes still verify and are
  upgraded on next sign-in),
  attaching `status` and role slugs to the session JWT (middleware, not
  `authorize()`, is what routes pending/roleless users to
  `/waiting-approval` — see below).
- `app/api/health` — quick route to confirm the DB connection works.

## ⚠️ Fields I assumed (no field list was provided for these)

`ContentBlock`, `Announcement`, `ReactionOption`, `ReactionVote`,
`GuideLink`, `RosterEntry`, `InventoryItem`, `CalendarEvent`, `Gallery`,
`GalleryImage`, `ActivityLog` — each model in `schema.prisma` has an
`// ASSUMPTION:` comment above it explaining the fields chosen. Review these
and tell me what to change (field names, types, required/optional,
relations) — happy to revise before you build UI on top of them.

## Setup

```bash
npm install

cp .env.example .env
# edit .env:
#  - DATABASE_URL = your Neon/Supabase connection string
#  - NEXTAUTH_SECRET = output of: openssl rand -base64 32
#  - (optional) SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD

npx prisma generate
npx prisma migrate dev --name init
npm run seed

npm run dev
```

Then visit `http://localhost:3000/api/health` to confirm the DB connection
and seeded role count.

### Neon-specific note

Neon gives you both a pooled and a direct connection string. For Prisma
migrations, the **direct** (non-pooled) URL is more reliable. If you hit
connection issues running `migrate dev`, add a `directUrl` to the
datasource block in `schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

and set `DIRECT_URL` in `.env` to the non-pooled connection string.

## Role model

- `Role.kind` is one of `basic | department | ldr | admin`.
- `UserRole` is the many-to-many join — a cadet can hold multiple roles
  (e.g. a department role *and* an LDR lead role simultaneously).
- New users are created with `status: pending` and no roles; an admin
  approves them and assigns roles (UI for this isn't built yet — this
  prompt only covers the foundation).

## Not yet built (future prompts)

- `/dashboard` page content and admin UI for approving users and assigning roles
- CRUD UI/API for Announcements, ContentBlocks, GuideLinks, Roster,
  Inventory, Calendar, Galleries
- ActivityLog writes wired into the above actions
- A nav/header layout for authenticated pages (deliberately NOT added to
  `/waiting-approval` — see below)

## Sign-in / sign-up / approval gate (this prompt)

- **`/login`** — NextAuth credentials sign-in, styled from your uploaded
  `login.html`. On success, redirects to `?next=` or `/dashboard`; the
  middleware (below) takes over from there if the account isn't fully
  onboarded yet.
- **`/signup`** — creates a `User` with `status: pending` and **zero**
  roles (no `UserRole` rows), then shows a confirmation message in place
  of the form.
- **`middleware.ts`** — for any non-public route:
  1. No session → redirect to `/login?next=...`
  2. `status: pending` → redirect to `/waiting-approval`
  3. `status: approved` but zero roles → redirect to `/waiting-approval`
  4. Otherwise → allowed through
  `/`, `/login`, `/signup`, static files, and `/api/auth/*` are public.
- **`/waiting-approval`** — server component, **no nav** (it only inherits
  the bare root layout). Shows "Your account is waiting for staff
  approval" if pending, or "Waiting for a role to be assigned" if
  approved-but-roleless. Includes a "Check again" button that calls
  `useSession().update()` to re-pull fresh status/roles from the DB.

  ⚠️ **Known limitation**: role/status are embedded in the JWT at sign-in
  time. If an admin approves a user or assigns a role while that user is
  already signed in, they won't see it until they click "Check again" (or
  sign out/in). Middleware itself can't query Postgres directly because it
  runs on the Edge runtime — see comments in `middleware.ts` and
  `lib/auth.ts` for how `update()` plugs into the `jwt()` callback to
  refresh without a full re-login.

- **`lib/permissions.ts`** — maps role slugs → per-page `view`/`edit`
  access (`PageKey` × `PermissionLevel`). ⚠️ **Assumption**: the `PageKey`
  list (dashboard, announcements, content-blocks, guide-links, roster,
  inventory, calendar, gallery, reactions, users-admin, roles-admin,
  activity-log) and the specific role→page grants weren't specified —
  review `DEPARTMENT_PERMISSIONS` / `LDR_PERMISSIONS` in that file and
  adjust. Two enforcement helpers are provided:
  - `requirePagePermission(page, level)` — call at the top of a Server
    Component; redirects to `/login`, `/waiting-approval`, or `/dashboard`
    as appropriate.
  - `assertPagePermission(page, level)` — call inside a Server Action;
    throws `PermissionError` instead of redirecting, so the calling form
    can surface the error.

---

## Dept/LDR pages + Admin (this prompt)

Built on top of the foundation above:

- **`/dept`** and **`/dept/[slug]`** — public index of the 18 department
  roles and a per-department page rendering that department's
  `ContentBlock` (key `dept:<role-slug>`, auto-created on first visit).
  Editable only by a signed-in user holding that exact department role
  (or admin) — see `canEditDepartment` / `assertDepartmentEdit` in
  `lib/permissions.ts`.
- **`/ldr`** and **`/ldr/[slug]`** — same pattern for the 13 LDR roles
  (`canEditLdr` / `assertLdrEdit`), plus two extra sections scoped to that
  LDR via `Announcement.ldrSlug` / `GuideLink.ldrSlug`:
  - **Announcements** — title + body (shown as a short blurb, click to
    expand to the full body), optional `eventAt` date/time, pin-to-top,
    and a **reaction bar**: custom emoji+label buttons
    (`ReactionOption`, scoped per-LDR) that any approved member can vote
    on, tallied live from `ReactionVote`. The team's lead can add/edit/
    remove their own reaction buttons inline.
  - **Guide links** — title, URL, optional description.
- **`/admin/users`** — list every `User`, approve/deny pending accounts
  (deny on a pending account deletes it; "revoke" on an approved account
  clears their roles and returns them to pending), multi-select role
  assignment (checkbox chips grouped by `Role.kind`), and a recent
  `ActivityLog` table. Gated by the `users-admin` page key — `admin`
  always gets edit; `personnel-officer` / `information-management-officer`
  get view-only per `DEPARTMENT_PERMISSIONS`.
- **`/admin/website`** — tabbed editor (Announcements / Calendar /
  Gallery) for the records that actually feed the public `/announcements`,
  `/calendar`, and `/gallery` pages — full CRUD on `Announcement` (with
  `ldrSlug: null`, distinguishing these from LDR-scoped ones above),
  `CalendarEvent`, and `Gallery`/`GalleryImage`. Gated by the
  `website-admin` page key — `admin` and
  `public-affairs-officer-communications` get edit.

⚠️ **Schema additions for this prompt**: `Announcement.ldrSlug` (nullable
— null means site-wide) + `Announcement.eventAt` (optional, LDR
announcements only); `GuideLink.ldrSlug` (nullable); `ReactionOption`
gained `ldrSlug` + `order` (every reaction option now belongs to one LDR).
Run `npx prisma generate` and push/migrate before using these routes.

Every mutation across dept/ldr/admin routes writes a best-effort
`ActivityLog` entry via `lib/activity-log.ts`'s `logActivity()`.

---

## Logistics, Personnel, IG/Stan Eval, Superintendent 341 (this prompt)

- **`/dashboard/inventory`** — full CRUD on `InventoryItem` (add/edit/
  delete), client-side filters by category and status, and a
  checked-in/checked-out toggle that stamps `statusChangedAt` and sets/
  clears `assignedTo`. Page loads for anyone with at least `view` on the
  `inventory` page key (Finance Officer, Superintendent, Director of
  Mission Support, and a few LDR teams that track their own gear get
  read-only access); the add/edit/delete/checkout controls only render
  for whoever has `edit` — **Logistics Officer, Uniform Custodian,
  Equipment Custodian**, Director of Mission Support, and admin.
  ⚠️ **Schema addition**: `InventoryItem.status` (`"checked_in"` |
  `"checked_out"`, default `"checked_in"`) + `InventoryItem.statusChangedAt`.
  ⚠️ **New roles**: "Uniform Custodian" and "Equipment Custodian" were
  added to `prisma/seed.ts` as department-kind roles (they didn't exist
  before this prompt) — run the seed again after migrating to create them,
  then assign them to cadets from `/admin/users`.
- **`/dashboard/personnel`** — full editable `RosterEntry` table
  (add/edit/deactivate/delete), with a flight filter and an "include
  inactive" toggle. Gated by the new `personnel` page key — **Personnel
  Officer**, **1st Sergeant**, and admin get edit; nobody else can even
  load the page. This is deliberately a *different* page key than
  `roster`: `/dashboard/roster` and the new public **`/roster`** page
  both render the exact same `RosterEntry` data **read-only** (see below)
  — editing only ever happens here.
- **`/roster`** (public site) — read-only cadet roster, same query/columns
  as `/dashboard/roster`, just reachable without signing in (added to
  `middleware.ts`'s public paths and the site header nav).
- **`/dashboard/inspection`** — IG / Stan Eval's Unit Assessment
  Checklist: a fillable rubric rendered from the static
  `lib/rubric.ts` (Sections 1–5, each item rated on a 4-point or
  Yes/No/N/A scale with an optional comment), plus header fields (unit,
  inspector, date) and an overall-comments box. **Nothing on this page
  is written to the database** — it's plain React state — and a
  "Generate PDF" button (via `jsPDF`, see `lib/pdf-generator.ts`) renders
  everything currently filled in to a downloadable PDF. Gated by the new
  `ig-inspection` page key — **Inspector General**, **Stan Eval Officer**,
  and admin only.
  ⚠️ **Placeholder content**: the real Section 1–5 items/rating scales
  weren't provided (the prompt had a bracketed placeholder where they
  should go), so `lib/rubric.ts` currently holds original, generic
  AFJROTC-style inspection items I wrote to unblock the UI — **not** a
  transcription of any real HQ AFJROTC / Stan Eval checklist. Replace
  `UNIT_ASSESSMENT_SECTIONS` in that one file with your unit's actual
  checklist; nothing else needs to change.
- **`/dashboard/superintendent-341`** — Form 341: name, description, a
  Good/Bad assessment toggle, and an Approved/Denied decision, also with
  a "Generate PDF" button and **no database writes**. Gated by the new
  `superintendent-341` page key — **Superintendent** and admin only.
  ⚠️ **Assumption**: no real Form 341 layout was provided, so the fields
  are exactly what the task described (name/description/Good-Bad/
  Approved-Denied) — extend `Form341.tsx` if your actual form has more
  fields.

`lib/pdf-generator.ts` is a small shared `jsPDF` wrapper
(`generateFormPdf({ title, meta, sections, filename })`) used by both the
inspection sheet and the 341 form — add a new `PdfSection[]` and call it
again if you add more client-side-only forms later.

---

## Security, privacy, and accessibility

### Rate limiting (Upstash Redis)

Every endpoint is rate limited. Policies live in one place —
`POLICIES` in `lib/rate-limit.ts`:

| Tier | Limit | Applies to |
|---|---|---|
| `auth` | 5 / 15 min | Sign-in, keyed by **both** IP and email |
| `signup` | 3 / hour | Account requests, by IP |
| `mutation` | 30 / min | Every Server Action, by user id |
| `expensive` | 10 / min | PDF generation, bulk writes |
| `api` | 60 / min | `/api/health` |
| `global` | 300 / min | Whole-site backstop in `middleware.ts` |

Server Actions are covered **at the choke point**, not file by file:
every action calls one of the `assert*` helpers in
`lib/permissions-server.ts`, and the limit is enforced there. New action
files are protected automatically.

Mutations key on **user id**, not IP, because cadets share the school's
public IP — an IP-keyed limit would let one busy cadet lock out a class.

**Fail-open.** If `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
are unset or Upstash is unreachable, requests are **allowed** and a
warning is logged. A Redis outage should not lock every cadet out. The
cost is that protection silently stops during an outage — check
`GET /api/health` as an admin, which reports `rateLimiting: enabled |
DISABLED`.

### Bot protection (Cloudflare Turnstile)

Turnstile guards `/login` and `/signup`, verified server-side in
`lib/turnstile.ts`. Unlike rate limiting it **fails closed**: if
Cloudflare is unreachable, sign-in is refused rather than dropping bot
protection on the credential endpoint.

With the keys unset the widget is not rendered and verification is
skipped, so local development works without a Cloudflare account.

### Password hashing

`lib/password.ts` uses **PBKDF2-HMAC-SHA256, 600,000 iterations**
(OWASP's floor) via WebCrypto, which runs as a native primitive in both
Node and Workers.

Existing **bcrypt hashes still work.** `verifyPassword` accepts both
formats, and a legacy hash is transparently re-hashed on the user's next
successful sign-in. Nobody is locked out and no password reset is needed.

Retiring bcrypt once every account has migrated:

```sql
-- Accounts still on a bcrypt hash:
SELECT COUNT(*) FROM "User" WHERE "passwordHash" LIKE '$2%';
```

When that reaches 0, drop `bcryptjs` from `package.json` and delete the
bcrypt branch in `lib/password.ts`.

### FERPA directory information

The public `/roster` page lists cadet names, which is **directory
information** under FERPA. Federal law requires an opt-out
(34 CFR § 99.37), so `RosterEntry.directoryOptOut` was added:

```sql
-- Remove a cadet from the PUBLIC roster (still visible in the portal):
UPDATE "RosterEntry" SET "directoryOptOut" = true WHERE id = '...';
```

The public roster filters on it; the authenticated portal does not.
**There is no admin UI for this flag yet** — set it with SQL, or add a
toggle to `/dashboard/personnel`. Defaults to `false`, matching a
district FERPA notice that treats directory disclosure as opt-out. If
your district's notice is opt-**in**, flip the default in
`prisma/schema.prisma`.

### Legal pages

`/privacy`, `/terms`, and `/accessibility` are written to match how the
site actually behaves. Shared facts (contacts, subprocessors, the "last
updated" date) live in `lib/legal.ts` — edit there, not in the pages.

> **These have not been reviewed by an attorney.** Before publishing,
> have the district administration or counsel check them against board
> policy, the annual FERPA notice, and the records retention schedule.
> Each page carries a visible note to that effect — delete those notes
> once review is done.

### Accessibility

The public site targets **WCAG 2.1 Level AA** (the standard DOJ set for
public entities in 28 CFR Part 35). Built in: skip link, AA-verified
contrast tokens, visible focus rings, keyboard-operable nav / calendar /
lightbox with focus trapping and restore, labelled form fields, live
regions for result counts, breadcrumbs, 48px touch targets,
`prefers-reduced-motion` support, and a pause control for the hero
video.

Known gaps are listed honestly on `/accessibility` — chiefly gallery
images without captions, and the cadet portal, which has **not** had the
same pass. Keep that page truthful as things change.

---

## Where this deploys

**Vercel is the supported target.** Its free (Hobby) tier runs this app
completely, sign-in included. Follow "Deploying to Vercel" below.

Cloudflare Workers is also fully configured and builds successfully, but
**its free tier cannot run this app** — see the appendix at the end for
the measurements and what it would take.

---

## Deploying to Vercel

### 1. Push to GitHub, then import

Import the repo at [vercel.com/new](https://vercel.com/new). Vercel
auto-detects Next.js; no build configuration is needed. `postinstall`
already runs `prisma generate`.

### 2. Environment variables

Set these in **Project → Settings → Environment Variables** for
Production (and Preview, if previews should hit the same database):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **pooled** string (Transaction mode, port 6543) |
| `DIRECT_URL` | Supabase **direct** string (port 5432) — migrations only |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://oh-20221.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` — **generate a fresh one**, don't reuse dev |
| `UPSTASH_REDIS_REST_URL` | From the Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | From the Upstash console |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret |

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is inlined at build time — after
changing it you must **redeploy**, not just restart.

If the two Upstash variables are missing, the site still runs but rate
limiting is silently off. Confirm with `GET /api/health` signed in as an
admin: it reports `rateLimiting` and `turnstile` as `enabled` or
`DISABLED`.

### 3. Apply migrations

From your machine, with `.env` pointed at the production database:

```bash
npx prisma migrate deploy
```

Vercel's build must **not** run `migrate dev` — it can prompt
interactively. Stick to `migrate deploy`.

### 4. Seed roles and a first admin

```bash
SEED_ADMIN_EMAIL=you@example.org SEED_ADMIN_PASSWORD='a-strong-password' npm run seed
```

Sign in, then change that password.

### Cost on the free tier

Vercel Hobby, Supabase free, and Upstash free together cover a unit site
of this size at no cost. Cloudflare Turnstile is free at any volume.
Hobby is licensed for non-commercial use, which a school program fits.

---

## Appendix: Cloudflare Workers

Configured and working via [OpenNext](https://opennext.js.org/cloudflare)
(`open-next.config.ts`, `wrangler.jsonc`, `npm run cf:*`). Kept as an
option — but it needs the **paid** plan.

### Why the Workers free tier does not work

Measured on this codebase, not estimated:

| Limit | Free | This app |
|---|---|---|
| Compressed Worker size | 3 MB | **1.96 MB — fits** ✅ |
| CPU time per request | **10 ms** | **sign-in needs ~98 ms** ❌ |

Bundle size is fine. **CPU time is the blocker.** One PBKDF2 password
verification at the OWASP-recommended 600,000 iterations costs about
98 ms of CPU:

| Iterations | CPU | Verdict |
|---|---|---|
| 600,000 | 97.6 ms | OWASP floor — correct |
| 300,000 | 51.6 ms | still 5× over the free limit |
| 210,000 | 36.1 ms | still 3.6× over |
| 100,000 | 16.3 ms | **still over**, and well below OWASP |

There is no iteration count both secure and under 10 ms, and rendering a
dynamic page costs CPU before hashing even starts.

**The iteration count is deliberately 600,000.** Lowering it to fit a
free tier would weaken password security on a site holding student
records. Vercel avoids the trade-off entirely, which is why it is the
supported target.

Workers Paid ($5/month) raises the CPU limit to 30 s and everything
works as built.

### 1. Install and authenticate

```bash
npx wrangler login
```

### 2. Set secrets

Never put these in `wrangler.jsonc` — that file is committed.

```bash
npx wrangler secret put DATABASE_URL              # Supabase POOLED url, port 6543
npx wrangler secret put NEXTAUTH_SECRET           # openssl rand -base64 32
npx wrangler secret put NEXTAUTH_URL              # https://your-worker-url
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put UPSTASH_REDIS_REST_URL
npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` is **not** a secret — it is inlined at
build time, so it must be present in the environment when you run
`cf:build`, not set via `wrangler secret`.

### 3. Preview locally in the Workers runtime

```bash
npm run cf:preview
```

This runs the real `workerd` runtime, not Node — it catches
Workers-only failures that `next dev` cannot.

### 4. Deploy

```bash
npm run cf:deploy
```

### How Prisma works on Workers

Prisma's default query engine is a native binary and cannot run on
Workers. `lib/prisma.ts` detects the Workers runtime (via the
`WebSocketPair` global) and switches to `@prisma/adapter-pg`, which
reaches Postgres over the TCP sockets `nodejs_compat` provides. Node
keeps using the standard engine, so local dev, `next build`, migrations,
and seeding are unchanged.

This requires `previewFeatures = ["driverAdapters"]` on the generator
block in `prisma/schema.prisma`, and `DATABASE_URL` **must** point at
Supabase's transaction-mode pooler (port 6543). The pool is capped at
one connection per isolate; a larger pool would exhaust Postgres'
connection limit as isolates multiply.

### Adding a Content-Security-Policy

`middleware.ts` sets `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, and HSTS, but deliberately
**no CSP**. The app loads styles and scripts from three external origins
(Google Fonts, the Font Awesome CDN, Cloudflare Turnstile) and Next
injects inline bootstrap scripts, so a CSP without nonce plumbing would
either break the site or be too permissive to help.

To add one properly: generate a per-request nonce in middleware, pass it
to Next's script loader, self-host the fonts and icons to remove two
origins, and allow `https://challenges.cloudflare.com` for Turnstile.

---

## After your first deploy

Sign in with the seeded admin account, then use `/admin/users` to
approve everyone else and assign their department / LDR roles.

Remaining setup that is not code:

- Drop the hero video into `public/media/` (see the README there).
- Get Upstash and Turnstile keys and set them in Vercel.
- Have the district review `/privacy`, `/terms`, and `/accessibility`,
  then delete the "not reviewed by an attorney" notes on those pages.
- Set `directoryOptOut` for any cadet whose family has opted out of
  public directory information.
