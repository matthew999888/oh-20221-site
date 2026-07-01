"use client";

import { useState, useTransition } from "react";
import {
  addGalleryImage,
  createGallery,
  deleteGallery,
  deleteGalleryImage,
  updateGallery
} from "./_actions";

export type SiteGalleryImage = { id: string; url: string; caption: string | null };
export type SiteGallery = {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  images: SiteGalleryImage[];
};

export default function GalleryEditor({ initial }: { initial: SiteGallery[] }) {
  const [galleries, setGalleries] = useState(initial);
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: { title: string; description: string }) {
    startTransition(async () => {
      const created = await createGallery(input);
      setGalleries((prev) => [
        { id: created.id, title: created.title, description: created.description, coverImage: created.coverImage, images: [] },
        ...prev
      ]);
      setComposing(false);
      setOpenId(created.id);
    });
  }

  function handleUpdate(id: string, input: { title: string; description: string }) {
    startTransition(async () => {
      await updateGallery(id, input);
      setGalleries((prev) =>
        prev.map((g) => (g.id === id ? { ...g, title: input.title, description: input.description || null } : g))
      );
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this gallery and all its photos?")) return;
    startTransition(async () => {
      await deleteGallery(id);
      setGalleries((prev) => prev.filter((g) => g.id !== id));
    });
  }

  function handleAddImage(galleryId: string, input: { url: string; caption: string }) {
    startTransition(async () => {
      const image = await addGalleryImage(galleryId, input);
      setGalleries((prev) =>
        prev.map((g) =>
          g.id === galleryId
            ? {
                ...g,
                images: [...g.images, { id: image.id, url: image.url, caption: image.caption }],
                coverImage: g.coverImage ?? image.url
              }
            : g
        )
      );
    });
  }

  function handleDeleteImage(galleryId: string, imageId: string) {
    if (!confirm("Remove this photo?")) return;
    startTransition(async () => {
      await deleteGalleryImage(galleryId, imageId);
      setGalleries((prev) =>
        prev.map((g) => (g.id === galleryId ? { ...g, images: g.images.filter((i) => i.id !== imageId) } : g))
      );
    });
  }

  return (
    <div>
      <div className="content-block__actions" style={{ marginBottom: "1rem" }}>
        <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
          <i className="fa-solid fa-plus" /> New gallery
        </button>
      </div>

      {composing && (
        <GalleryForm onCancel={() => setComposing(false)} onSubmit={handleCreate} isPending={isPending} />
      )}

      <div className="announcement-list">
        {galleries.length === 0 && !composing && <p className="content-block__empty">No galleries yet.</p>}

        {galleries.map((g) => {
          const isOpen = openId === g.id;
          return (
            <article className="content-box" key={g.id}>
              <div className="content-box__header">
                <button
                  className="announcement-card__top"
                  style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                  onClick={() => setOpenId(isOpen ? null : g.id)}
                >
                  <h2 className="content-box__title">
                    {g.title} <span className="dash-list__meta">({g.images.length} photo{g.images.length === 1 ? "" : "s"})</span>
                  </h2>
                  <i className={`fa-solid fa-chevron-${isOpen ? "up" : "down"}`} aria-hidden="true" />
                </button>
                <div className="content-box__controls">
                  <button className="icon-btn icon-btn--danger" title="Delete gallery" onClick={() => handleDelete(g.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="content-box__body">
                  <GalleryMetaForm
                    initial={g}
                    onSave={(input) => handleUpdate(g.id, input)}
                    isPending={isPending}
                  />

                  <div className="lightbox-grid" style={{ marginTop: "1rem" }}>
                    {g.images.map((img) => (
                      <div className="lightbox-grid__item" key={img.id} style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.caption ?? ""} loading="lazy" />
                        {img.caption && <span className="lightbox-grid__caption">{img.caption}</span>}
                        <button
                          className="icon-btn icon-btn--danger"
                          style={{ position: "absolute", top: 6, right: 6 }}
                          title="Remove photo"
                          onClick={() => handleDeleteImage(g.id, img.id)}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <AddImageForm onSubmit={(input) => handleAddImage(g.id, input)} isPending={isPending} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function GalleryForm({
  onSubmit,
  onCancel,
  isPending
}: {
  onSubmit: (input: { title: string; description: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="content-box__edit" style={{ marginBottom: "1rem" }}>
      <input className="form-input" placeholder="Gallery title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
          disabled={isPending || !title.trim()}
          onClick={() => onSubmit({ title, description })}
        >
          Create
        </button>
        <button className="btn-small" disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function GalleryMetaForm({
  initial,
  onSave,
  isPending
}: {
  initial: { title: string; description: string | null };
  onSave: (input: { title: string; description: string }) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="content-block__header" style={{ padding: 0 }}>
        <div>{description && <p className="content-block__description">{description}</p>}</div>
        <button className="btn-small" onClick={() => setEditing(true)}>
          <i className="fa-solid fa-pen" /> Edit details
        </button>
      </div>
    );
  }

  return (
    <div className="content-box__edit">
      <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gallery title" />
      <textarea
        className="form-input"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
      />
      <div className="content-block__actions">
        <button
          className="btn-small btn-small--primary"
          disabled={isPending}
          onClick={() => {
            onSave({ title, description });
            setEditing(false);
          }}
        >
          Save
        </button>
        <button className="btn-small" disabled={isPending} onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddImageForm({
  onSubmit,
  isPending
}: {
  onSubmit: (input: { url: string; caption: string }) => void;
  isPending: boolean;
}) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  return (
    <div className="content-box__edit" style={{ marginTop: "1rem" }}>
      <input
        className="form-input"
        placeholder="Google Drive share link or direct image URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        className="form-input"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <div className="content-block__actions">
        <button
          className="btn-small btn-small--primary"
          disabled={isPending || !url.trim()}
          onClick={() => {
            onSubmit({ url, caption });
            setUrl("");
            setCaption("");
          }}
        >
          <i className="fa-solid fa-plus" /> Add photo
        </button>
      </div>
    </div>
  );
}
