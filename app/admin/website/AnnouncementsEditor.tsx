"use client";

import { useState, useTransition } from "react";
import {
  createSiteAnnouncement,
  deleteSiteAnnouncement,
  updateSiteAnnouncement,
  type SiteAnnouncementInput
} from "./_actions";

export type SiteAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishAt: string;
  expiresAt: string | null;
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AnnouncementsEditor({ initial }: { initial: SiteAnnouncement[] }) {
  const [items, setItems] = useState(initial);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: SiteAnnouncementInput) {
    startTransition(async () => {
      const created = await createSiteAnnouncement(input);
      setItems((prev) =>
        [
          {
            id: created.id,
            title: created.title,
            body: created.body,
            pinned: created.pinned,
            publishAt: created.publishAt.toString(),
            expiresAt: created.expiresAt ? created.expiresAt.toString() : null
          },
          ...prev
        ].sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime())
      );
      setComposing(false);
    });
  }

  function handleUpdate(id: string, input: SiteAnnouncementInput) {
    startTransition(async () => {
      await updateSiteAnnouncement(id, input);
      setItems((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, title: input.title, body: input.body, pinned: input.pinned, publishAt: input.publishAt, expiresAt: input.expiresAt }
            : a
        )
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      await deleteSiteAnnouncement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
    });
  }

  return (
    <div>
      <div className="content-block__actions" style={{ marginBottom: "1rem" }}>
        <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
          <i className="fa-solid fa-plus" /> New announcement
        </button>
      </div>

      {composing && (
        <SiteAnnouncementForm onCancel={() => setComposing(false)} onSubmit={handleCreate} isPending={isPending} />
      )}

      <div className="announcement-list">
        {items.length === 0 && !composing && <p className="content-block__empty">No unit-wide announcements yet.</p>}

        {items.map((a) =>
          editingId === a.id ? (
            <article className="announcement-card" key={a.id}>
              <SiteAnnouncementForm
                initial={a}
                onCancel={() => setEditingId(null)}
                onSubmit={(input) => handleUpdate(a.id, input)}
                isPending={isPending}
              />
            </article>
          ) : (
            <article className="announcement-card" key={a.id}>
              {a.pinned && <span className="info-card__pin">Pinned</span>}
              <h3>{a.title}</h3>
              <time className="info-card__date">
                Publishes {new Date(a.publishAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                {a.expiresAt && ` · Expires ${new Date(a.expiresAt).toLocaleDateString()}`}
              </time>
              <div className="announcement-card__body">
                {a.body.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <div className="content-box__controls" style={{ marginTop: "0.75rem" }}>
                <button className="icon-btn" title="Edit" onClick={() => setEditingId(a.id)}>
                  <i className="fa-solid fa-pen" />
                </button>
                <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(a.id)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
}

function SiteAnnouncementForm({
  initial,
  onSubmit,
  onCancel,
  isPending
}: {
  initial?: SiteAnnouncement;
  onSubmit: (input: SiteAnnouncementInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [publishAt, setPublishAt] = useState(toDatetimeLocal(initial?.publishAt ?? new Date().toISOString()));
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocal(initial?.expiresAt ?? null));

  return (
    <div className="content-box__edit" style={{ marginBottom: "1rem" }}>
      <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="form-input" rows={5} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="form-label">
        Publish at
        <input className="form-input" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
      </label>
      <label className="form-label">
        Expires (optional)
        <input className="form-input" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </label>
      <label className="form-label" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Pin to top
      </label>
      <div className="content-block__actions">
        <button
          className="btn-small btn-small--primary"
          disabled={isPending}
          onClick={() => onSubmit({ title, body, pinned, publishAt, expiresAt: expiresAt || null })}
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
