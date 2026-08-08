/**
 * lib/permissions.ts
 *
 * ASSUMPTION: no page-key list was specified, so this defines a
 * reasonable set of page keys covering the models scaffolded earlier
 * (announcements, content blocks, guide links, roster, inventory,
 * calendar, galleries, plus admin-only user/role management, the
 * unit-website editor, and the activity log). Add/rename PageKey entries
 * to match your real page list, then adjust ROLE_PAGE_PERMISSIONS
 * accordingly — the enforcement helpers below don't need to change.
 *
 * Model:
 *  - Every Role has a `kind`: basic | department | ldr | admin.
 *  - `admin` always gets edit access to everything.
 *  - `basic` kind roles (Unassigned, Basic Cadet) get view-only access
 *    to a small set of public-ish pages.
 *  - `department` and `ldr` roles get page-specific access defined by
 *    slug below (e.g. the Logistics Officer can edit Inventory; the
 *    Drill Team lead can edit their own roster/calendar entries, etc.)
 *  - A user's *effective* permission on a page is the highest level
 *    granted by ANY of their roles.
 *  - Separately, dept/[slug] and ldr/[slug] pages are each editable only
 *    by the ONE role tied to that exact department/team (see
 *    canEditDepartment / canEditLdr below) — that's an instance-level
 *    check, not a page-key check, since every department/team needs its
 *    own answer to "who can edit *this* page."
 *
 * ADDED IN THIS PASS: `personnel` (full RosterEntry edit — distinct from
 * `roster`, which stays read-only everywhere it's rendered), `ig-inspection`
 * (IG/Stan Eval's fillable rubric — no DB writes, gating just controls who
 * can open the form) and `superintendent-341` (same, for the Superintendent's
 * 341 form). Also added two new department-kind roles, "Uniform Custodian"
 * and "Equipment Custodian" (see prisma/seed.ts), both granted `inventory`
 * edit alongside the Logistics Officer.
 */

export type PageKey =
  | "dashboard"
  | "announcements"
  | "content-blocks"
  | "guide-links"
  | "roster"
  | "personnel"
  | "inventory"
  | "calendar"
  | "gallery"
  | "reactions"
  | "ops-order"
  | "promotions"
  | "promotion-scores"
  | "cadet-guide"
  | "events"
  | "cadet-forms"
  | "staff-forms-review"
  | "ig-inspection"
  | "superintendent-341"
  | "users-admin"
  | "roles-admin"
  | "website-admin"
  | "activity-log";

export type PermissionLevel = "none" | "view" | "edit";

const LEVEL_RANK: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  edit: 2
};

export function levelMeetsRequirement(level: PermissionLevel, required: PermissionLevel) {
  return LEVEL_RANK[level] >= LEVEL_RANK[required];
}

function higherLevel(a: PermissionLevel, b: PermissionLevel): PermissionLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

const ALL_PAGE_KEYS: PageKey[] = [
  "dashboard",
  "announcements",
  "content-blocks",
  "guide-links",
  "roster",
  "personnel",
  "inventory",
  "calendar",
  "gallery",
  "reactions",
  "ops-order",
  "promotions",
  "promotion-scores",
  "cadet-guide",
  "events",
  "cadet-forms",
  "staff-forms-review",
  "ig-inspection",
  "superintendent-341",
  "users-admin",
  "roles-admin",
  "website-admin",
  "activity-log"
];

// Pages every signed-in, approved, role-having user can at least view.
const BASIC_VIEW_PAGES: PageKey[] = [
  "dashboard",
  "announcements",
  "content-blocks",
  "guide-links",
  "roster",
  "calendar",
  "gallery",
  "reactions",
  "ops-order",
  "promotions",
  "cadet-guide",
  "events",
  "cadet-forms"
];

type PagePermissionMap = Partial<Record<PageKey, PermissionLevel>>;

// Slugs below must match prisma/seed.ts's slugify() output for the role
// names (e.g. "Logistics Officer" -> "logistics-officer").
const DEPARTMENT_PERMISSIONS: Record<string, PagePermissionMap> = {
  "corps-commander": { announcements: "edit", roster: "edit", calendar: "edit", "ops-order": "edit", "promotion-scores": "view", events: "edit", "staff-forms-review": "view" },
  "vice-corps-commander": { announcements: "edit", roster: "edit", calendar: "edit", "ops-order": "edit", "promotion-scores": "view", events: "edit", "staff-forms-review": "view" },
  "executive-officer": { announcements: "edit", roster: "view", calendar: "edit", "ops-order": "edit", "promotion-scores": "view", events: "edit", "staff-forms-review": "view" },
  superintendent: { roster: "view", inventory: "view", "superintendent-341": "edit", "promotion-scores": "view", "staff-forms-review": "view" },
  "1st-sergeant": { roster: "view", personnel: "edit", promotions: "edit", "promotion-scores": "view", events: "edit", "staff-forms-review": "view" },
  "inspector-general": { "activity-log": "view", roster: "view", "ig-inspection": "edit" },
  "stan-eval-officer": { "activity-log": "view", "ig-inspection": "edit" },
  "director-of-operations": { calendar: "edit", "guide-links": "edit", "ops-order": "edit", events: "edit" },
  "personnel-officer": { personnel: "edit", "users-admin": "view", promotions: "edit", events: "edit" },
  "training-officer": { calendar: "edit", "guide-links": "edit", "cadet-guide": "edit", events: "edit" },
  "finance-officer": { inventory: "view" },
  "public-affairs-officer-communications": {
    announcements: "edit",
    "content-blocks": "edit",
    gallery: "edit",
    "website-admin": "edit"
  },
  "director-of-mission-support": { inventory: "edit" },
  "logistics-officer": { inventory: "edit" },
  "uniform-custodian": { inventory: "edit" },
  "equipment-custodian": { inventory: "edit" },
  "information-management-officer": {
    "content-blocks": "edit",
    "guide-links": "edit",
    "users-admin": "view",
    "cadet-guide": "edit"
  },
  "health-and-wellness-officer": { "guide-links": "edit" },
  "special-teams-officer": { calendar: "edit" },
  "cadet-project-manager-cpm": { calendar: "edit", announcements: "edit", events: "edit" }
};

const LDR_PERMISSIONS: Record<string, PagePermissionMap> = {
  "drill-team": { calendar: "edit", gallery: "edit" },
  "color-guard": { calendar: "edit", gallery: "edit" },
  "raiders-physical-fitness-team": { calendar: "edit", gallery: "edit" },
  "saber-team": { calendar: "edit", gallery: "edit" },
  "marksmanship-team-where-authorized": { calendar: "edit", inventory: "view" },
  "academic-bowl-jlab": { calendar: "edit" },
  cyberpatriot: { calendar: "edit" },
  stellarxplorers: { calendar: "edit" },
  "model-rocketry-team": { calendar: "edit", inventory: "view" },
  "unmanned-aircraft-systems-drone-team": { calendar: "edit", inventory: "view" },
  "robotics-team": { calendar: "edit", inventory: "view" },
  "orienteering-team": { calendar: "edit" },
  "planning-committees-military-ball-awards-ceremony-parades-community-service-etc": {
    calendar: "edit",
    announcements: "edit"
  }
};

const BASE_ROLE_PERMISSIONS: Record<string, PagePermissionMap> = {
  admin: Object.fromEntries(ALL_PAGE_KEYS.map((k) => [k, "edit"])) as PagePermissionMap,
  "basic-cadet": Object.fromEntries(BASIC_VIEW_PAGES.map((k) => [k, "view"])) as PagePermissionMap,
  unassigned: {}
};

export const ROLE_PAGE_PERMISSIONS: Record<string, PagePermissionMap> = {
  ...BASE_ROLE_PERMISSIONS,
  ...DEPARTMENT_PERMISSIONS,
  ...LDR_PERMISSIONS
};

/**
 * Returns the user's effective permission level for a page, given the
 * list of role slugs attached to their session/user record. Roles always
 * "stack up" — if any role grants edit, the user gets edit, even if
 * another role of theirs only grants view or none.
 *
 * Every approved+roled user implicitly gets at least BASIC_VIEW_PAGES at
 * "view" (matching the "Basic Cadet" baseline), regardless of which
 * specific department/LDR roles they hold, since those are additive
 * specializations on top of basic membership.
 */
export function getPagePermission(roleSlugs: string[], page: PageKey): PermissionLevel {
  let level: PermissionLevel = BASIC_VIEW_PAGES.includes(page) ? "view" : "none";

  for (const slug of roleSlugs) {
    const grant = ROLE_PAGE_PERMISSIONS[slug]?.[page];
    if (grant) level = higherLevel(level, grant);
  }

  return level;
}

export function canView(roleSlugs: string[], page: PageKey): boolean {
  return levelMeetsRequirement(getPagePermission(roleSlugs, page), "view");
}

export function canEdit(roleSlugs: string[], page: PageKey): boolean {
  return levelMeetsRequirement(getPagePermission(roleSlugs, page), "edit");
}

// ---------------------------------------------------------------------
// Per-instance permissions for dept/[slug] and ldr/[slug] pages
// ---------------------------------------------------------------------
//
// Unlike the page-key system above (one global permission per kind of
// page), each department and LDR page is editable only by the specific
// role tied to *that* department/LDR (e.g. only the "Logistics Officer"
// role can edit /dept/logistics-officer; only the "Drill Team" role can
// edit /ldr/drill-team). A role's slug is generated from its name via
// the same slugify() used in prisma/seed.ts, so the role slug IS the
// page slug. Admins can always edit every department/LDR page.

export function canEditDepartment(roleSlugs: string[], deptSlug: string): boolean {
  return roleSlugs.includes("admin") || roleSlugs.includes(deptSlug);
}

export function canEditLdr(roleSlugs: string[], ldrSlug: string): boolean {
  return roleSlugs.includes("admin") || roleSlugs.includes(ldrSlug);
}

// ---------------------------------------------------------------------
