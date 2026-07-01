"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export async function approveUser(userId: string) {
  const session = await assertPagePermission("users-admin", "edit");

  await prisma.user.update({ where: { id: userId }, data: { status: "approved" } });
  await logActivity(session.user.id, "user.approved", "User", userId);
  revalidatePath("/admin/users");
}

/**
 * "Deny" removes a pending account outright (nothing to keep — they
 * never had access to anything). For an already-approved account this
 * instead revokes access by clearing their roles and putting them back
 * in "pending" so a future re-approval starts clean.
 */
export async function denyUser(userId: string) {
  const session = await assertPagePermission("users-admin", "edit");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (user.status === "pending") {
    await prisma.user.delete({ where: { id: userId } });
    await logActivity(session.user.id, "user.denied", "User", userId, { email: user.email });
  } else {
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { status: "pending" } });
    await logActivity(session.user.id, "user.access-revoked", "User", userId, { email: user.email });
  }

  revalidatePath("/admin/users");
}

export async function updateUserRoles(userId: string, roleIds: string[]) {
  const session = await assertPagePermission("users-admin", "edit");

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true
    })
  ]);

  await logActivity(session.user.id, "user.roles-updated", "User", userId, { roleIds });
  revalidatePath("/admin/users");
}
