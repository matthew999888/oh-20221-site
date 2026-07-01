import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?next=" + encodeURIComponent("/admin/users"));
  }

  if (session.user.status === "pending" || session.user.roles.length === 0) {
    redirect("/waiting-approval");
  }

  const roleRecords = await prisma.role.findMany({
    where: { slug: { in: session.user.roles } },
    select: { name: true }
  });
  const roleLabel = roleRecords.map((r) => r.name).join(", ") || "Cadet";

  return (
    <DashboardShell roles={session.user.roles} name={session.user.name ?? "Cadet"} roleLabel={roleLabel}>
      {children}
    </DashboardShell>
  );
}
