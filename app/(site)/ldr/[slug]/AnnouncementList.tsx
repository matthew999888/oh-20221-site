"use client";

import { useState, useTransition } from "react";
import {
  createLdrAnnouncement,
  createLdrReactionOption,
  deleteLdrAnnouncement,
  deleteLdrReactionOption,
  toggleAnnouncementReaction,
  updateLdrAnnouncement,
  updateLdrReactionOption,
  type LdrAnnouncementInput
} from "./_actions";

export type ReactionTally = {
  optionId: string;
  emoji: string;
  label: string;
  count: number;
  votedByMe: boolean;
};

export type LdrAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  eventAt: string | null; // ISO
  publishAt: string; // ISO
  reactions: ReactionTally[];
};

export type LdrReactionOption = { id: string; emoji: string; label: string };

function formatEventAt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AnnouncementList({
  ldrSlug,
  initialAnnouncements,
  reactionOptions,
  canEdit,
  canReact
}: {
  ldrSlug: string;
  initialAnnouncements: LdrAnnouncement[];
  reactionOptions: LdrReactionOption[];
  canEdit: boolean;
  canReact: boolean;
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingReactions, setManagingReactions] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleVote(announcementId: string, optionId: string) {
    if (!canReact) return;
    // optimistic toggle
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== announcementId) return a;
        return {
          ...a,
          reactions: a.reactions.map((r) =>
            r.optionId === optionId
              ? { ...r, count: r.votedByMe ? r.count - 1 : r.count + 1, votedByMe: !r.votedByMe }
              : r
          )
        };
      })
    );
    startTransition(async () => {
      await toggleAnnouncementReaction(ldrSlug, announcementId, optionId);
    });
  }

  function handleCreate(input: LdrAnnouncementInput) {
    startTransition(async () => {
      const created = await createLdrAnnouncement(ldrSlug, input);
      setAnnouncements((prev) => [
        {
          id: created.id,
          title: created.title,
          body: created.body,
          pinned: created.pinned,
          eventAt: created.eventAt ? created.eventAt.toString() : null,
          publishAt: created.publishAt.toString(),
          reactions: reactionOptions.map((o) => ({ optionId: o.id, emoji: o.emoji, label: o.label, count: 0, votedByMe: false }))
        },
        ...prev
      ]);
      setComposing(false);
    });
  }

  function handleUpdate(id: string, input: LdrAnnouncementInput) {
    startTransition(async () => {
      await updateLdrAnnouncement(ldrSlug, id, input);
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, title: input.title, body: input.body, pinned: input.pinned, eventAt: input.eventAt }
            : a
        )
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    startTransition(async () => {
      await deleteLdrAnnouncement(ldrSlug, id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    });
  }

  return (
    <section className="content-block">
      <header className="content-block__header">
        <div>
          <h2 className="content-block__title">Announcements</h2>
          <p className="content-block__description">Team news, results, and upcoming events.</p>
        </div>
        {canEdit && (
          <div className="content-block__actions">
            <button className="btn-small" onClick={() => setManagingReactions((v) => !v)}>
              <i className="fa-solid fa-icons" /> Reaction buttons
            </button>
            <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
              <i className="fa-solid fa-plus" /> New announcement
            </button>
          </div>
        )}
      </header>

      {managingReactions && canEdit && (
        <ReactionOptionsEditor ldrSlug={ldrSlug} initialOptions={reactionOptions} />
      )}

      {composing && (
        <AnnouncementForm
          onCancel={() => setComposing(false)}
          onSubmit={handleCreate}
          isPending={isPending}
        />
      )}

      <div className="announcement-list">
        {announcements.length === 0 && !composing && (
          <p className="content-block__empty">No announcements yet.</p>
        )}

        {announcements.map((a) => {
          const isExpanded = expanded.has(a.id);
          const blurb = a.body.length > 140 ? a.body.slice(0, 140) + "…" : a.body;

          if (editingId === a.id) {
            return (
              <article className="announcement-card" key={a.id}>
                <AnnouncementForm
                  initial={a}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(input) => handleUpdate(a.id, input)}
                  isPending={isPending}
                />
              </article>
            );
          }

          return (
            <article className="announcement-card" key={a.id}>
              {a.pinned && <span className="info-card__pin">Pinned</span>}
              <div className="announcement-card__top" onClick={() => toggleExpand(a.id)} role="button" tabIndex={0}>
                <h3>{a.title}</h3>
                <i className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"}`} aria-hidden="true" />
              </div>
              {a.eventAt && (
                <time className="info-card__date">
                  <i className="fa-solid fa-calendar-day" /> {formatEventAt(a.eventAt)}
                </time>
              )}
              <div className="announcement-card__body" onClick={() => toggleExpand(a.id)} role="button" tabIndex={-1}>
                {(isExpanded ? a.body : blurb).split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>

              {reactionOptions.length > 0 && (
                <div className="reaction-bar">
                  {a.reactions.map((r) => (
                    <button
                      key={r.optionId}
                      className={`reaction-pill${r.votedByMe ? " is-active" : ""}`}
                      disabled={!canReact}
                      title={canReact ? r.label : "Sign in to react"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(a.id, r.optionId);
                      }}
                    >
                      <span>{r.emoji}</span> {r.label} <span className="reaction-pill__count">{r.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {canEdit && (
                <div className="content-box__controls" style={{ marginTop: "0.75rem" }}>
                  <button className="icon-btn" title="Edit" onClick={() => setEditingId(a.id)}>
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(a.id)}>
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AnnouncementForm({
  initial,
  onSubmit,
  onCancel,
  isPending
}: {
  initial?: { title: string; body: string; pinned: boolean; eventAt: string | null };
  onSubmit: (input: LdrAnnouncementInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [eventAt, setEventAt] = useState(toDatetimeLocal(initial?.eventAt ?? null));
  const [pinned, setPinned] = useState(initial?.pinned ?? false);

  return (
    <div className="content-box__edit" style={{ marginBottom: "1rem" }}>
      <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="form-input"
        rows={4}
        placeholder="Short blurb / full details"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <label className="form-label">
        Date/time (optional)
        <input
          className="form-input"
          type="datetime-local"
          value={eventAt}
          onChange={(e) => setEventAt(e.target.value)}
        />
      </label>
      <label className="form-label" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        Pin to top
      </label>
      <div className="content-block__actions">
        <button
          className="btn-small btn-small--primary"
          disabled={isPending}
          onClick={() => onSubmit({ title, body, eventAt: eventAt || null, pinned })}
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

function ReactionOptionsEditor({ ldrSlug, initialOptions }: { ldrSlug: string; initialOptions: LdrReactionOption[] }) {
  const [options, setOptions] = useState(initialOptions);
  const [newEmoji, setNewEmoji] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      const created = await createLdrReactionOption(ldrSlug, { emoji: newEmoji || "👍", label: newLabel });
      setOptions((prev) => [...prev, created]);
      setNewEmoji("");
      setNewLabel("");
    });
  }

  function save(id: string, emoji: string, label: string) {
    startTransition(async () => {
      await updateLdrReactionOption(ldrSlug, id, { emoji, label });
      setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, emoji, label } : o)));
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteLdrReactionOption(ldrSlug, id);
      setOptions((prev) => prev.filter((o) => o.id !== id));
    });
  }

  return (
    <div className="content-box">
      <h3 className="content-box__title">Custom reaction buttons</h3>
      <div className="reaction-editor">
        {options.map((o) => (
          <div className="reaction-editor__row" key={o.id}>
            <input
              className="form-input reaction-editor__emoji"
              value={o.emoji}
              onChange={(e) => setOptions((prev) => prev.map((x) => (x.id === o.id ? { ...x, emoji: e.target.value } : x)))}
              onBlur={(e) => save(o.id, e.target.value, o.label)}
            />
            <input
              className="form-input"
              value={o.label}
              onChange={(e) => setOptions((prev) => prev.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
              onBlur={(e) => save(o.id, o.emoji, e.target.value)}
            />
            <button className="icon-btn icon-btn--danger" disabled={isPending} onClick={() => remove(o.id)}>
              <i className="fa-solid fa-trash" />
            </button>
          </div>
        ))}
        <div className="reaction-editor__row">
          <input
            className="form-input reaction-editor__emoji"
            placeholder="👍"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
          />
          <input
            className="form-input"
            placeholder="New button label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button className="icon-btn" disabled={isPending} onClick={add}>
            <i className="fa-solid fa-plus" />
          </button>
        </div>
      </div>
    </div>
  );
}
