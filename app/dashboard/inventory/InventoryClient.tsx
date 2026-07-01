"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createInventoryItem,
  deleteInventoryItem,
  toggleInventoryStatus,
  updateInventoryItem,
  type InventoryItemInput
} from "./_actions";

export type InventoryItemRow = {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  quantity: number;
  condition: string | null;
  status: string;
  statusChangedAt: string | null;
  location: string | null;
  assignedTo: string | null;
  notes: string | null;
};

export default function InventoryClient({ initial, canEdit }: { initial: InventoryItemRow[]; canEdit: boolean }) {
  const [items, setItems] = useState(initial);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [checkoutTargetId, setCheckoutTargetId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked_in" | "checked_out">("all");
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const filtered = items
    .filter((i) => (categoryFilter === "all" ? true : i.category === categoryFilter))
    .filter((i) => (statusFilter === "all" ? true : i.status === statusFilter))
    .sort((a, b) => a.name.localeCompare(b.name));

  function handleCreate(input: InventoryItemInput) {
    startTransition(async () => {
      const created = await createInventoryItem(input);
      setItems((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          category: created.category,
          sku: created.sku,
          quantity: created.quantity,
          condition: created.condition,
          status: created.status,
          statusChangedAt: created.statusChangedAt ? created.statusChangedAt.toString() : null,
          location: created.location,
          assignedTo: created.assignedTo,
          notes: created.notes
        }
      ]);
      setComposing(false);
    });
  }

  function handleUpdate(id: string, input: InventoryItemInput) {
    startTransition(async () => {
      await updateInventoryItem(id, input);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                name: input.name,
                category: input.category || null,
                sku: input.sku || null,
                quantity: input.quantity,
                condition: input.condition || null,
                location: input.location || null,
                assignedTo: input.assignedTo || null,
                notes: input.notes || null
              }
            : i
        )
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this inventory item?")) return;
    startTransition(async () => {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  function handleCheckIn(id: string) {
    startTransition(async () => {
      const updated = await toggleInventoryStatus(id, "checked_in", "");
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: "checked_in", assignedTo: null, statusChangedAt: updated.statusChangedAt!.toString() } : i
        )
      );
    });
  }

  function handleCheckOut(id: string, assignedTo: string) {
    startTransition(async () => {
      const updated = await toggleInventoryStatus(id, "checked_out", assignedTo);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: "checked_out", assignedTo: updated.assignedTo, statusChangedAt: updated.statusChangedAt!.toString() }
            : i
        )
      );
      setCheckoutTargetId(null);
    });
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Inventory</h1>
      <p className="dash-page__subtitle">
        Unit supply, uniforms, and equipment. Checking an item in/out stamps the time it happened.
      </p>

      <div className="content-block__actions" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <select className="form-input" style={{ width: "auto" }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="checked_in">Checked in</option>
          <option value="checked_out">Checked out</option>
        </select>
        {canEdit && (
          <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
            <i className="fa-solid fa-plus" /> Add item
          </button>
        )}
      </div>

      {!canEdit && (
        <p className="content-block__empty" style={{ marginTop: "0.5rem" }}>
          <i className="fa-solid fa-eye" /> You have view-only access to inventory.
        </p>
      )}

      {composing && canEdit && (
        <div className="content-box" style={{ marginTop: "1rem" }}>
          <InventoryItemForm onCancel={() => setComposing(false)} onSubmit={handleCreate} isPending={isPending} />
        </div>
      )}

      <div className="table-scroll" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Condition</th>
              <th>Status</th>
              <th>Checked out to</th>
              <th>Since</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !composing && (
              <tr>
                <td colSpan={8} className="content-block__empty">
                  No items match this filter.
                </td>
              </tr>
            )}

            {filtered.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td colSpan={8}>
                    <InventoryItemForm
                      initial={item}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(input) => handleUpdate(item.id, input)}
                      isPending={isPending}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={item.id}>
                  <td>
                    {item.name}
                    {item.sku && <div className="dash-list__meta">SKU: {item.sku}</div>}
                  </td>
                  <td>{item.category ?? "—"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.condition ?? "—"}</td>
                  <td>
                    <span className={`reaction-pill${item.status === "checked_out" ? " is-active" : ""}`} style={{ cursor: "default" }}>
                      {item.status === "checked_out" ? "Checked out" : "Checked in"}
                    </span>
                  </td>
                  <td>{item.assignedTo ?? "—"}</td>
                  <td>{item.statusChangedAt ? new Date(item.statusChangedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                  <td>
                    {canEdit ? (
                      <div className="content-box__controls" style={{ flexWrap: "wrap" }}>
                        {item.status === "checked_out" ? (
                          <button className="btn-small" disabled={isPending} onClick={() => handleCheckIn(item.id)}>
                            Check in
                          </button>
                        ) : checkoutTargetId === item.id ? (
                          <CheckoutInline
                            onCancel={() => setCheckoutTargetId(null)}
                            onConfirm={(name) => handleCheckOut(item.id, name)}
                            isPending={isPending}
                          />
                        ) : (
                          <button className="btn-small" disabled={isPending} onClick={() => setCheckoutTargetId(item.id)}>
                            Check out
                          </button>
                        )}
                        <button className="icon-btn" title="Edit" onClick={() => setEditingId(item.id)}>
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button className="icon-btn icon-btn--danger" title="Delete" disabled={isPending} onClick={() => handleDelete(item.id)}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheckoutInline({
  onConfirm,
  onCancel,
  isPending
}: {
  onConfirm: (assignedTo: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <span style={{ display: "inline-flex", gap: "0.35rem" }}>
      <input
        className="form-input"
        style={{ width: "140px" }}
        placeholder="Checked out to…"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="btn-small btn-small--primary" disabled={isPending || !name.trim()} onClick={() => onConfirm(name)}>
        Confirm
      </button>
      <button className="btn-small" disabled={isPending} onClick={onCancel}>
        Cancel
      </button>
    </span>
  );
}

function InventoryItemForm({
  initial,
  onSubmit,
  onCancel,
  isPending
}: {
  initial?: InventoryItemRow;
  onSubmit: (input: InventoryItemInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="content-box__edit" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" }}>
      <input className="form-input" placeholder="Item name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="form-input" placeholder="Category, e.g. Uniform, Equipment" value={category} onChange={(e) => setCategory(e.target.value)} />
      <input className="form-input" placeholder="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} />
      <input className="form-input" placeholder="Quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <input className="form-input" placeholder="Condition, e.g. new/good/worn" value={condition} onChange={(e) => setCondition(e.target.value)} />
      <input className="form-input" placeholder="Storage location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <input className="form-input" placeholder="Currently assigned to (optional)" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
      <textarea
        className="form-input"
        style={{ gridColumn: "1 / -1" }}
        rows={2}
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="content-block__actions" style={{ gridColumn: "1 / -1" }}>
        <button
          className="btn-small btn-small--primary"
          disabled={isPending || !name.trim()}
          onClick={() => onSubmit({ name, category, sku, quantity: Number(quantity) || 0, condition, location, assignedTo, notes })}
        >
          Save
        </button>
        <button className="btn-small" disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
