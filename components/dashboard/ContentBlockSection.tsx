"use client";

import { useState, useTransition } from "react";
import type { PageKey } from "@/lib/permissions";
import {
  createContentBlockBox,
  deleteContentBlockBox,
  reorderContentBlockBoxes,
  updateContentBlockBox,
  updateContentBlockMeta
} from "@/app/dashboard/_actions/content-blocks";

type Box = {
  id: string;
  title: string;
  body: string;
  order: number;
};

type ContentBlockSectionProps = {
  page: PageKey;
  path: string;
  contentBlockId: string;
  initialTitle: string;
  initialDescription: string;
  initialBoxes: Box[];
  canEdit: boolean;
};

export default function ContentBlockSection({
  page,
  path,
  contentBlockId,
  initialTitle,
  initialDescription,
  initialBoxes,
  canEdit
}: ContentBlockSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);

  function saveMeta() {
    startTransition(async () => {
      await updateContentBlockMeta(page, contentBlockId, { title, description }, path);
      setEditingMeta(false);
    });
  }

  function addBox() {
    startTransition(async () => {
      const box = await createContentBlockBox(page, contentBlockId, path);
      setBoxes((prev) => [...prev, box]);
      setEditingBoxId(box.id);
    });
  }

  function saveBox(id: string, nextTitle: string, nextBody: string) {
    startTransition(async () => {
      await updateContentBlockBox(page, id, { title: nextTitle, body: nextBody }, path);
      setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, title: nextTitle, body: nextBody } : b)));
      setEditingBoxId(null);
    });
  }

  function removeBox(id: string) {
    if (!confirm("Remove this section? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteContentBlockBox(page, id, path);
      setBoxes((prev) => prev.filter((b) => b.id !== id));
    });
  }

  function moveBox(id: string, direction: -1 | 1) {
    const index = boxes.findIndex((b) => b.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= boxes.length) return;

    const reordered = [...boxes];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setBoxes(reordered);

    startTransition(async () => {
      await reorderContentBlockBoxes(page, reordered.map((b) => b.id), path);
    });
  }

  return (
    <section className="content-block">
      <header className="content-block__header">
        {editingMeta ? (
          <div className="content-block__meta-edit">
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
            />
            <textarea
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown under the title"
            />
            <div className="content-block__actions">
              <button className="btn-small btn-small--primary" disabled={isPending} onClick={saveMeta}>
                Save
              </button>
              <button
                className="btn-small"
                disabled={isPending}
                onClick={() => {
                  setTitle(initialTitle);
                  setDescription(initialDescription);
                  setEditingMeta(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="content-block__title">{title}</h1>
              {description && <p className="content-block__description">{description}</p>}
            </div>
            {canEdit && (
              <button className="btn-small" onClick={() => setEditingMeta(true)}>
                <i className="fa-solid fa-pen" /> Edit header
              </button>
            )}
          </>
        )}
      </header>

      <div className="content-block__boxes">
        {boxes.length === 0 && <p className="content-block__empty">No sections yet.</p>}

        {boxes.map((box, i) => (
          <article className="content-box" key={box.id}>
            {editingBoxId === box.id ? (
              <EditableBox
                box={box}
                onCancel={() => setEditingBoxId(null)}
                onSave={(t, b) => saveBox(box.id, t, b)}
                isPending={isPending}
              />
            ) : (
              <>
                <div className="content-box__header">
                  <h2 className="content-box__title">{box.title}</h2>
                  {canEdit && (
                    <div className="content-box__controls">
                      <button
                        className="icon-btn"
                        title="Move up"
                        disabled={i === 0 || isPending}
                        onClick={() => moveBox(box.id, -1)}
                      >
                        <i className="fa-solid fa-arrow-up" />
                      </button>
                      <button
                        className="icon-btn"
                        title="Move down"
                        disabled={i === boxes.length - 1 || isPending}
                        onClick={() => moveBox(box.id, 1)}
                      >
                        <i className="fa-solid fa-arrow-down" />
                      </button>
                      <button className="icon-btn" title="Edit" onClick={() => setEditingBoxId(box.id)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        title="Delete"
                        disabled={isPending}
                        onClick={() => removeBox(box.id)}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="content-box__body">
                  {box.body
                    ? box.body.split("\n").map((line, idx) => <p key={idx}>{line}</p>)
                    : <p className="content-block__empty">(empty)</p>}
                </div>
              </>
            )}
          </article>
        ))}

        {canEdit && (
          <button className="btn-add-box" disabled={isPending} onClick={addBox}>
            <i className="fa-solid fa-plus" /> Add section
          </button>
        )}
      </div>
    </section>
  );
}

function EditableBox({
  box,
  onSave,
  onCancel,
  isPending
}: {
  box: Box;
  onSave: (title: string, body: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(box.title);
  const [body, setBody] = useState(box.body);

  return (
    <div className="content-box__edit">
      <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Section title" />
      <textarea
        className="form-input"
        rows={6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Section content"
      />
      <div className="content-block__actions">
        <button className="btn-small btn-small--primary" disabled={isPending} onClick={() => onSave(title, body)}>
          Save
        </button>
        <button className="btn-small" disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
