"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export type InventoryItemInput = {
  name: string;
  category: string;
  sku: string;
  quantity: number;
  condition: string;
  location: string;
  assignedTo: string;
  notes: string;
};

export async function createInventoryItem(data: InventoryItemInput) {
  const session = await assertPagePermission("inventory", "edit");

  const item = await prisma.inventoryItem.create({
    data: {
      name: data.name.trim() || "Untitled item",
      category: data.category.trim() || null,
      sku: data.sku.trim() || null,
      quantity: Number.isFinite(data.quantity) ? data.quantity : 0,
      condition: data.condition.trim() || null,
      location: data.location.trim() || null,
      assignedTo: data.assignedTo.trim() || null,
      notes: data.notes.trim() || null,
      status: "checked_in",
      statusChangedAt: new Date()
    }
  });

  await logActivity(session.user.id, "inventory-item.created", "InventoryItem", item.id);
  revalidatePath("/dashboard/inventory");
  return item;
}

export async function updateInventoryItem(id: string, data: InventoryItemInput) {
  const session = await assertPagePermission("inventory", "edit");

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: data.name.trim() || "Untitled item",
      category: data.category.trim() || null,
      sku: data.sku.trim() || null,
      quantity: Number.isFinite(data.quantity) ? data.quantity : 0,
      condition: data.condition.trim() || null,
      location: data.location.trim() || null,
      assignedTo: data.assignedTo.trim() || null,
      notes: data.notes.trim() || null
    }
  });

  await logActivity(session.user.id, "inventory-item.updated", "InventoryItem", id);
  revalidatePath("/dashboard/inventory");
  return item;
}

export async function deleteInventoryItem(id: string) {
  const session = await assertPagePermission("inventory", "edit");
  await prisma.inventoryItem.delete({ where: { id } });
  await logActivity(session.user.id, "inventory-item.deleted", "InventoryItem", id);
  revalidatePath("/dashboard/inventory");
}

/**
 * Toggles an item between "checked_in" and "checked_out", stamping
 * `statusChangedAt` with the current time. `assignedTo` is set/cleared to
 * reflect who it's checked out to (empty string clears it on check-in).
 */
export async function toggleInventoryStatus(id: string, nextStatus: "checked_in" | "checked_out", assignedTo: string) {
  const session = await assertPagePermission("inventory", "edit");

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      status: nextStatus,
      statusChangedAt: new Date(),
      assignedTo: nextStatus === "checked_out" ? assignedTo.trim() || null : null
    }
  });

  await logActivity(session.user.id, `inventory-item.${nextStatus}`, "InventoryItem", id, { assignedTo: item.assignedTo });
  revalidatePath("/dashboard/inventory");
  return item;
}
