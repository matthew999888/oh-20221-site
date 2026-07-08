export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import StaffJournalForm from "./StaffJournalForm";

export default async function StaffJournalPage() {
  const session = await requirePagePermission("cadet-forms", "view");

  const entries = await prisma.staffJournalEntry.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <StaffJournalForm
      initialEntries={entries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
    />
  );
}
