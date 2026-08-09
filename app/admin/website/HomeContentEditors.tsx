"use client";

import { useState, useTransition } from "react";
import {
  clearHomeImage,
  createFaq,
  createInstructor,
  deleteFaq,
  deleteInstructor,
  deleteMessage,
  saveHomeImage,
  setMessageHandled,
  updateFaq,
  updateInstructor
} from "./_actions";

export type AdminInstructor = {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  order: number;
};
export type AdminHomeImage = { slot: string; url: string; alt: string; caption: string | null };
export type AdminFaq = { id: string; question: string; answer: string; order: number };
export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
};

/** The photo positions the homepage actually reads. Adding one here is
 *  not enough — the page must render a <HomeFigure> for it too. */
export const HOME_IMAGE_SLOTS: { slot: string; label: string; hint: string }[] = [
  {
    slot: "corps",
    label: "Corps photo — full width band",
    hint: "The whole-unit group photo, shown between the command staff and the instructors. Displayed uncropped, so upload it exactly as you want it seen. Leave empty to use the built-in photo."
  },
  { slot: "about", label: "About section — left", hint: "Cadets in class, drill, or formation." },
  { slot: "service", label: "About section — right", hint: "Community service or a ceremony." }
];

function DriveHelp() {
  return (
    <p className="form-hint" style={{ fontSize: "0.8rem", opacity: 0.8 }}>
      Paste a Google Drive share link. In Drive: right-click the file &rarr; Share &rarr; General
      access &rarr; <strong>Anyone with the link</strong>, then Copy link. If it is not set to
      &ldquo;anyone with the link&rdquo;, the photo will not load for visitors.
    </p>
  );
}

/* ── Instructors ─────────────────────────────────────────────────── */
export function InstructorsEditor({ initial }: { initial: AdminInstructor[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();

  const blank: AdminInstructor = {
    id: "",
    name: "",
    title: "",
    bio: "",
    photoUrl: "",
    order: rows.length
  };
  const [draft, setDraft] = useState<AdminInstructor | null>(null);

  function save(d: AdminInstructor) {
    start(async () => {
      const payload = {
        name: d.name,
        title: d.title,
        bio: d.bio,
        photoUrl: d.photoUrl ?? "",
        order: d.order
      };
      if (d.id) {
        const updated = await updateInstructor(d.id, payload);
        setRows((r) => r.map((x) => (x.id === d.id ? { ...x, ...updated } : x)));
      } else {
        const created = await createInstructor(payload);
        setRows((r) => [...r, created]);
      }
      setDraft(null);
    });
  }

  return (
    <div>
      <p className="dash-page__subtitle">
        Shown in the &ldquo;Unit leadership&rdquo; section of the homepage, ordered by the order
        number.
      </p>

      {rows.map((r) => (
        <div className="content-block__box" key={r.id}>
          <strong>{r.name}</strong> — {r.title}
          <p style={{ opacity: 0.75, fontSize: "0.88rem", margin: "0.4rem 0" }}>
            {r.bio.slice(0, 160)}
            {r.bio.length > 160 ? "…" : ""}
          </p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            Photo: {r.photoUrl ? "set" : "none"} · Order: {r.order}
          </p>
          <div className="content-block__actions">
            <button className="btn-small" onClick={() => setDraft(r)} disabled={pending}>
              Edit
            </button>
            <button
              className="btn-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await deleteInstructor(r.id);
                  setRows((x) => x.filter((y) => y.id !== r.id));
                })
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {draft ? (
        <div className="content-block__box">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <label className="form-label">Title</label>
          <input
            className="form-input"
            placeholder="SASI — OH-20221"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <label className="form-label">Biography</label>
          <textarea
            className="form-input"
            rows={5}
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          />
          <label className="form-label">Photo — Google Drive link</label>
          <input
            className="form-input"
            placeholder="https://drive.google.com/file/d/…/view"
            value={draft.photoUrl ?? ""}
            onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })}
          />
          <DriveHelp />
          <label className="form-label">Order</label>
          <input
            className="form-input"
            type="number"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: parseInt(e.target.value, 10) || 0 })}
          />
          <div className="content-block__actions">
            <button className="btn-small btn-small--primary" onClick={() => save(draft)} disabled={pending}>
              Save
            </button>
            <button className="btn-small" onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-small btn-small--primary" onClick={() => setDraft(blank)}>
          Add instructor
        </button>
      )}
    </div>
  );
}

/* ── Homepage photo slots ────────────────────────────────────────── */
export function HomePhotosEditor({ initial }: { initial: AdminHomeImage[] }) {
  const [rows, setRows] = useState<Record<string, AdminHomeImage>>(
    Object.fromEntries(initial.map((i) => [i.slot, i]))
  );
  const [pending, start] = useTransition();

  return (
    <div>
      <p className="dash-page__subtitle">
        Fixed positions on the homepage. Leave one empty and the page simply omits it.
      </p>
      {HOME_IMAGE_SLOTS.map(({ slot, label, hint }) => {
        const row = rows[slot] ?? { slot, url: "", alt: "", caption: null };
        return (
          <div className="content-block__box" key={slot}>
            <strong>{label}</strong>
            <p style={{ fontSize: "0.82rem", opacity: 0.75, margin: "0.3rem 0 0.6rem" }}>{hint}</p>

            <label className="form-label">Google Drive link</label>
            <input
              className="form-input"
              value={row.url}
              placeholder="https://drive.google.com/file/d/…/view"
              onChange={(e) => setRows({ ...rows, [slot]: { ...row, url: e.target.value } })}
            />
            <DriveHelp />

            <label className="form-label">
              Alt text (required — describes the photo for screen readers)
            </label>
            <input
              className="form-input"
              value={row.alt}
              placeholder="Cadets marching in formation on the school field"
              onChange={(e) => setRows({ ...rows, [slot]: { ...row, alt: e.target.value } })}
            />

            <label className="form-label">Caption (optional)</label>
            <input
              className="form-input"
              value={row.caption ?? ""}
              onChange={(e) => setRows({ ...rows, [slot]: { ...row, caption: e.target.value } })}
            />

            <div className="content-block__actions">
              <button
                className="btn-small btn-small--primary"
                disabled={pending || !row.url.trim() || !row.alt.trim()}
                onClick={() =>
                  start(async () => {
                    await saveHomeImage({
                      slot,
                      url: row.url,
                      alt: row.alt,
                      caption: row.caption ?? ""
                    });
                  })
                }
              >
                Save
              </button>
              <button
                className="btn-small"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await clearHomeImage(slot);
                    setRows({ ...rows, [slot]: { slot, url: "", alt: "", caption: null } });
                  })
                }
              >
                Clear
              </button>
            </div>
            {!row.alt.trim() && row.url.trim() && (
              <p style={{ fontSize: "0.8rem", color: "#ea5c73" }}>
                Alt text is required before this can be saved.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────────── */
export function FaqEditor({ initial }: { initial: AdminFaq[] }) {
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<AdminFaq | null>(null);
  const [pending, start] = useTransition();

  function save(d: AdminFaq) {
    start(async () => {
      const payload = { question: d.question, answer: d.answer, order: d.order };
      if (d.id) {
        const u = await updateFaq(d.id, payload);
        setRows((r) => r.map((x) => (x.id === d.id ? { ...x, ...u } : x)));
      } else {
        const c = await createFaq(payload);
        setRows((r) => [...r, c]);
      }
      setDraft(null);
    });
  }

  return (
    <div>
      <p className="dash-page__subtitle">
        Shown on the homepage as an expandable list. Hidden entirely if there are none.
      </p>

      {rows.map((r) => (
        <div className="content-block__box" key={r.id}>
          <strong>{r.question}</strong>
          <p style={{ opacity: 0.75, fontSize: "0.88rem", margin: "0.4rem 0" }}>
            {r.answer.slice(0, 180)}
            {r.answer.length > 180 ? "…" : ""}
          </p>
          <div className="content-block__actions">
            <button className="btn-small" onClick={() => setDraft(r)} disabled={pending}>
              Edit
            </button>
            <button
              className="btn-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await deleteFaq(r.id);
                  setRows((x) => x.filter((y) => y.id !== r.id));
                })
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {draft ? (
        <div className="content-block__box">
          <label className="form-label">Question</label>
          <input
            className="form-input"
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
          />
          <label className="form-label">Answer</label>
          <textarea
            className="form-input"
            rows={5}
            value={draft.answer}
            onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
          />
          <label className="form-label">Order</label>
          <input
            className="form-input"
            type="number"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: parseInt(e.target.value, 10) || 0 })}
          />
          <div className="content-block__actions">
            <button
              className="btn-small btn-small--primary"
              onClick={() => save(draft)}
              disabled={pending}
            >
              Save
            </button>
            <button className="btn-small" onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn-small btn-small--primary"
          onClick={() => setDraft({ id: "", question: "", answer: "", order: rows.length })}
        >
          Add question
        </button>
      )}
    </div>
  );
}

/* ── Contact inbox ───────────────────────────────────────────────── */
export function MessagesInbox({ initial }: { initial: AdminMessage[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();

  if (rows.length === 0) {
    return <p className="content-block__empty">No messages yet.</p>;
  }

  return (
    <div>
      <p className="dash-page__subtitle">
        Submissions from the contact form on the homepage. Replies go out from your own email —
        this is an inbox, not a mailer.
      </p>
      {rows.map((m) => (
        <div
          className="content-block__box"
          key={m.id}
          style={{ opacity: m.handled ? 0.55 : 1 }}
        >
          <strong>{m.subject || "(no subject)"}</strong>
          <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0.3rem 0" }}>
            {m.name} &lt;
            <a href={`mailto:${m.email}`} style={{ textDecoration: "underline" }}>
              {m.email}
            </a>
            &gt; · {new Date(m.createdAt).toLocaleString("en-US")}
          </p>
          <p style={{ whiteSpace: "pre-wrap", margin: "0.6rem 0" }}>{m.message}</p>
          <div className="content-block__actions">
            <a className="btn-small" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "Your message to OH-20221 AFJROTC")}`}>
              Reply
            </a>
            <button
              className="btn-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await setMessageHandled(m.id, !m.handled);
                  setRows((r) =>
                    r.map((x) => (x.id === m.id ? { ...x, handled: !x.handled } : x))
                  );
                })
              }
            >
              {m.handled ? "Mark unhandled" : "Mark handled"}
            </button>
            <button
              className="btn-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await deleteMessage(m.id);
                  setRows((r) => r.filter((x) => x.id !== m.id));
                })
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
