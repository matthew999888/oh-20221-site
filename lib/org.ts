import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

/**
 * Shared lookups for the dynamic dept/[slug] and ldr/[slug] routes.
 * Department and LDR pages are 1:1 with a Role record (kind "department"
 * or "ldr") — the role's slug IS the page slug.
 */

export async function getDepartmentRole(slug: string) {
  const role = await prisma.role.findFirst({ where: { slug, kind: "department" } });
  if (!role) notFound();
  return role;
}

export async function getLdrRole(slug: string) {
  const role = await prisma.role.findFirst({ where: { slug, kind: "ldr" } });
  if (!role) notFound();
  return role;
}

export function listDepartmentRoles() {
  return prisma.role.findMany({ where: { kind: "department" }, orderBy: { name: "asc" } });
}

export function listLdrRoles() {
  return prisma.role.findMany({ where: { kind: "ldr" }, orderBy: { name: "asc" } });
}

// Default reaction button set seeded for an LDR's announcement reaction
// bar the first time its page is visited, so leads always have something
// to customize rather than a blank/null state.
const DEFAULT_REACTIONS: { emoji: string; label: string }[] = [
  { emoji: "👍", label: "Like" },
  { emoji: "🔥", label: "Hype" },
  { emoji: "👏", label: "Nice" }
];

export async function getOrCreateLdrReactionOptions(ldrSlug: string) {
  const existing = await prisma.reactionOption.findMany({
    where: { ldrSlug },
    orderBy: { order: "asc" }
  });
  if (existing.length > 0) return existing;

  await prisma.$transaction(
    DEFAULT_REACTIONS.map((r, i) => prisma.reactionOption.create({ data: { ...r, ldrSlug, order: i } }))
  );

  return prisma.reactionOption.findMany({ where: { ldrSlug }, orderBy: { order: "asc" } });
}
