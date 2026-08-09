import type { PageKey } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: string; // Font Awesome class, e.g. "fa-solid fa-bullhorn"
  page: PageKey;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

// ASSUMPTION: groups roughly mirror the dashboard's information
// architecture (overview, unit content, org pages, member-management,
// admin-only). Every item is gated by its `page` PageKey via
// getPagePermission — items the current user can't at least "view" are
// filtered out of the sidebar. The "Org Pages" links to /dept and /ldr
// are gated on "dashboard" (i.e. shown to every signed-in member) since
// those routes are public and each department/team's own edit controls
// are gated separately (see canEditDepartment / canEditLdr).
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-gauge-high", page: "dashboard" }]
  },
  {
    label: "Unit Content",
    items: [
      { href: "/dashboard/announcements", label: "Announcements", icon: "fa-solid fa-bullhorn", page: "announcements" },
      { href: "/dashboard/ops-order", label: "Ops Order", icon: "fa-solid fa-clipboard-list", page: "ops-order" },
      { href: "/dashboard/promotions", label: "Promotions", icon: "fa-solid fa-ranking-star", page: "promotions" },
      { href: "/dashboard/promotion-scores", label: "Promotion Scores", icon: "fa-solid fa-chart-column", page: "promotion-scores" },
      { href: "/dashboard/promotions/manage", label: "Promotion Test Builder", icon: "fa-solid fa-pen-to-square", page: "promotion-tests-admin" },
      { href: "/dashboard/guides", label: "Guides", icon: "fa-solid fa-book-open", page: "guide-links" },
      { href: "/dashboard/cadet-guide", label: "Cadet Guide", icon: "fa-solid fa-graduation-cap", page: "cadet-guide" },
      { href: "/dashboard/events", label: "Event & Hours Tracker", icon: "fa-solid fa-clock", page: "events" },
      { href: "/dashboard/question-of-the-day", label: "Question of the Day", icon: "fa-solid fa-circle-question", page: "question-of-the-day" }
      // Gallery and Calendar were removed from this nav: they are public
      // pages, already reachable from the site header, and listing them
      // here implied they were portal tools. Editing still happens under
      // Admin -> Website.
    ]
  },
  {
    label: "Org Pages",
    items: [
      { href: "/dept", label: "Departments", icon: "fa-solid fa-sitemap", page: "dashboard" },
      { href: "/ldr", label: "Teams & Activities", icon: "fa-solid fa-flag", page: "dashboard" }
    ]
  },
  {
    label: "Unit Management",
    items: [
      { href: "/dashboard/roster", label: "Cadet Roster", icon: "fa-solid fa-users", page: "roster" },
      { href: "/dashboard/cadet-scores", label: "Cadet Scores", icon: "fa-solid fa-chart-line", page: "cadet-scores" },
      { href: "/dashboard/personnel", label: "Personnel", icon: "fa-solid fa-id-card", page: "personnel" },
      { href: "/dashboard/inventory", label: "Inventory", icon: "fa-solid fa-boxes-stacked", page: "inventory" }
    ]
  },
  {
    label: "Inspections & Forms",
    items: [
      { href: "/dashboard/inspection", label: "IG / Stan Eval Inspection", icon: "fa-solid fa-clipboard-check", page: "ig-inspection" },
      { href: "/dashboard/superintendent-341", label: "Superintendent 341", icon: "fa-solid fa-file-signature", page: "superintendent-341" },
      { href: "/dashboard/forms/staff-journal", label: "Staff Journal Entry", icon: "fa-solid fa-book", page: "cadet-forms" },
      { href: "/dashboard/forms/staff-evaluation", label: "Staff Cadet Evaluation", icon: "fa-solid fa-star-half-stroke", page: "cadet-forms" },
      { href: "/dashboard/forms/review", label: "Staff Forms Review", icon: "fa-solid fa-folder-open", page: "staff-forms-review" }
    ]
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: "fa-solid fa-user-gear", page: "users-admin" },
      { href: "/admin/website", label: "Website", icon: "fa-solid fa-globe", page: "website-admin" }
    ]
  }
];
