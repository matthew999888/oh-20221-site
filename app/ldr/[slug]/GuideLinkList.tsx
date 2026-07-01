"use client";

import { useState, useTransition } from "react";
import { createLdrGuideLink, deleteLdrGuideLink, updateLdrGuideLink, type LdrGuideLinkInput } from "./_actions";

export type LdrGuideLink = { id: string; title: string; url: string; description: string | null };

export default function GuideLinkList({
  ldrSlug,
  initialLinks,
  canEdit
}: {
  ldrSlug: string;
  initialLinks: LdrGuideLink[];
  canEdit: boolean;
}) {
  const [links, setLinks] = useState(initialLinks);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: LdrGuideLinkInput) {
    startTransition(async () => {
      const created = await createLdrGuideLink(ldrSlug, input);
      setLinks((prev) => [...prev, created]);
      setComposing(false);
    });
  }

  function handleUpdate(id: string, input: LdrGuideLinkInput) {
    startTransition(async () => {
      await updateLdrGuideLink(ldrSlug, id, input);
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...input } : l)));
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this link?")) return;
    startTransition(async () => {
      await deleteLdrGuideLink(ldrSlug, id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    });
  }

  return (
    <section className="content-block">
      <header className="content-block__header">
        <div>
          <h2 className="content-block__title">Guides &amp; Links</h2>
          <p className="content-block__description">Resources cadets on this team need.</p>
        </div>
        {canEdit && (
          <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
            <i className="fa-solid fa-plus" /> Add link
          </button>
        )}
      </header>

      {composing && <GuideLinkForm onCancel={() => setComposing(false)} onSubmit={handleCreate} isPending={isPending} />}

      <div className="guide-link-list">
        {links.length === 0 && !composing && <p className="content-block__empty">No links yet.</p>}

        {links.map((l) =>
          editingId === l.id ? (
            <div className="content-box" key={l.id}>
              <GuideLinkForm
                initial={l}
                onCancel={() => setEditingId(null)}
                onSubmit={(input) => handleUpdate(l.id, input)}
                isPending={isPending}
              />
            </div>
          ) : (
            <article className="guide-link-card" key={l.id}>
              <div>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="guide-link-card__title">
                  {l.title} <i className="fa-solid fa-arrow-up-right-from-square" />
                </a>
                {l.description && <p className="guide-link-card__desc">{l.description}</p>}
              </div>
              {canEdit && (
                <div className="content-box__controls">
                  <button className="icon-btn" title="Edit" onClick={() => setEditingId(l.id)}>
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(l.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              )}
            </article>
          )
        )}
      </div>
    </section>
  );
}

function GuideLinkForm({
  initial,
  onSubmit,
  onCancel,
  isPending
}: {
  initial?: { title: string; url: string; description: string | null };
  onSubmit: (input: LdrGuideLinkInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  return (
    <div className="content-box__edit" style={{ marginBottom: "1rem" }}>
      <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="form-input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      <textarea
        className="form-input"
        rows={2}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="content-block__actions">
        <button
          className="btn-small btn-small--primary"
          disabled={isPending || !title.trim() || !url.trim()}
          onClick={() => onSubmit({ title, url, description })}
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
