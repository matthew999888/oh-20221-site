export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import UsersAdminClient, { type AdminUser, type RoleOption, type ActivityLogEntry } from "./UsersAdminClient";

export default async function AdminUsersPage() {
  const session = await requirePagePermission("users-admin", "view");
  const editable = canEdit(session.user.roles, "users-admin");

  const [users, roles, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { roles: { select: { roleId: true } } }
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true } } }
    })
  ]);

  const adminUsers: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    roleIds: u.roles.map((r) => r.roleId)
  }));

  const roleOptions: RoleOption[] = roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug, kind: r.kind }));

  const activityLog: ActivityLogEntry[] = logs.map((l) => ({
    id: l.id,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    createdAt: l.createdAt.toISOString(),
    userName: l.user?.name ?? null
  }));

  return <UsersAdminClient initialUsers={adminUsers} roles={roleOptions} activityLog={activityLog} canEdit={editable} />;
}
