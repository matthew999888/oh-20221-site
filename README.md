# AFJROTC Unit Site — Foundation Scaffold

Next.js 14 (App Router, TypeScript) + Prisma (Postgres) + NextAuth (credentials).

## What's included

- `prisma/schema.prisma` — full schema: `User`, `Role`, `UserRole`,
  `ContentBlock`, `Announcement`, `ReactionOption`, `ReactionVote`,
  `GuideLink`, `RosterEntry`, `InventoryItem`, `CalendarEvent`, `Gallery`,
  `GalleryImage`, `ActivityLog`.
- `prisma/seed.ts` — seeds `Unassigned`, `Basic Cadet`, `Admin`, your 18
  department roles, and your 13 LDR roles. Optionally creates a first admin
  user if `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` are set.
- `lib/auth.ts` + `app/api/auth/[...nextauth]/route.ts` — NextAuth
  credentials provider checking bcrypt hash against `User.passwordHash`,
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

## Deploying to Vercel with Neon or Supabase

### 1. Provision a Postgres database

**Neon** (https://neon.tech): create a project, then copy the **pooled**
connection string (Neon labels it "Pooled connection" in the dashboard —
use this one for `DATABASE_URL` since Vercel's serverless functions need
connection pooling; Neon also gives you a separate **direct** connection
string, useful for running migrations from your own machine).

**Supabase** (https://supabase.com): create a project, then under
Project Settings → Database, copy the **connection pooling** string
(Transaction mode, port 6543) for `DATABASE_URL`, and the direct
connection string (port 5432) if you want a separate `DIRECT_URL` for
migrations.

Either way, append `?sslmode=require` to the connection string if it
isn't already there.

### 2. Set environment variables

Copy `.env.example` to `.env` for local dev, and set the same keys as
**Environment Variables** in the Vercel project settings (Project →
Settings → Environment Variables) for Production (and Preview, if you
want preview deploys to hit the same DB — or provision a second
Neon/Supabase branch/project for previews):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string from step 1 |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://your-unit.vercel.app` |
| `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` — **generate a fresh one for production**, don't reuse your local dev secret |
| `SEED_ADMIN_EMAIL` *(optional)* | Email for the first admin account, only read by `npm run seed` |
| `SEED_ADMIN_PASSWORD` *(optional)* | Password for that first admin account |

`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` only matter when you run the
seed script — they're not read by the running app, so it's fine to leave
them unset on Vercel and instead run the seed once from your own machine
(step 4) pointed at the production `DATABASE_URL`.

### 3. Push the schema

From your local machine, with `DATABASE_URL` in `.env` pointed at your
new Neon/Supabase database:

```bash
npm install
npx prisma migrate deploy   # applies committed migrations; use `prisma db push` instead if you haven't set up migrations yet
```

If this is a fresh schema with no migration history yet, generate one
first: `npx prisma migrate dev --name init` (creates the migration files
and applies them locally), commit the generated `prisma/migrations/`
folder, then use `prisma migrate deploy` for every environment after
that (Vercel's build should NOT run `migrate dev`, since that can prompt
interactively — stick to `migrate deploy` in CI/production).

### 4. Seed roles (and optionally a first admin)

Still pointed at the production database:

```bash
npm run seed
```

This upserts all base/department/LDR roles (safe to re-run any time you
add a role in `prisma/seed.ts`, like the Uniform/Equipment Custodian
roles added in this prompt) and, if `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` are set in your local `.env` at the time you run
it, creates that first admin account so you have a way to sign in and
approve everyone else through `/admin/users`.

### 5. Deploy

Push to GitHub and import the repo in Vercel (or run `vercel` from the
CLI). Vercel auto-detects Next.js — no custom build command needed. Add
a `postinstall` script if you'd rather have Prisma Client regenerate
automatically on every deploy (it's usually already covered by the
`prisma` package's own postinstall hook, but if you see a stale-client
error, add `"postinstall": "prisma generate"` to `package.json`).

After the first deploy, sign in with your seeded admin account, then use
`/admin/users` to approve everyone else and assign their department/LDR
roles.

---

