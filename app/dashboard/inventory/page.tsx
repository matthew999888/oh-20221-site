export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import InventoryClient, { type InventoryItemRow } from "./InventoryClient";

export default async function InventoryPage() {
  const session = await requirePagePermission("inventory", "view");
  const editable = canEdit(session.user.roles, "inventory");

  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });

  const initial: InventoryItemRow[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    sku: i.sku,
    quantity: i.quantity,
    condition: i.condition,
    status: i.status,
    statusChangedAt: i.statusChangedAt ? i.statusChangedAt.toISOString() : null,
    location: i.location,
    assignedTo: i.assignedTo,
    notes: i.notes
  }));

  return <InventoryClient initial={initial} canEdit={editable} />;
}
