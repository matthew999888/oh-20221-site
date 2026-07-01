"use client";

import { useMemo, useState } from "react";
import { RATING_SCALES, UNIT_ASSESSMENT_SECTIONS, type RatingOption, type ScaleType } from "@/lib/rubric";
import { generateFormPdf, type PdfSection } from "@/lib/pdf-generator";

type ItemState = { rating: string; comment: string };

/**
 * Entirely client-state — nothing here is persisted to the database.
 * The inspector fills the form in-browser, then "Generate PDF" renders
 * everything currently on screen into a downloadable PDF via jsPDF.
 * Refreshing the page discards the in-progress form, by design (see
 * task spec: "no database write").
 */
export default function InspectionForm() {
  const [unitName, setUnitName] = useState("OH-20221 AFJROTC — Logan High School");
  const [inspectorName, setInspectorName] = useState("");
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overallComments, setOverallComments] = useState("");
  const [items, setItems] = useState<Record<string, ItemState>>({});

  const totalItems = useMemo(() => UNIT_ASSESSMENT_SECTIONS.reduce((n, s) => n + s.items.length, 0), []);
  const ratedItems = useMemo(() => Object.values(items).filter((v) => v.rating).length, [items]);

  function setRating(itemId: string, rating: string) {
    setItems((prev) => ({ ...prev, [itemId]: { rating, comment: prev[itemId]?.comment ?? "" } }));
  }

  function setComment(itemId: string, comment: string) {
    setItems((prev) => ({ ...prev, [itemId]: { rating: prev[itemId]?.rating ?? "", comment } }));
  }

  function scaleFor(type: ScaleType | undefined): RatingOption[] {
    return RATING_SCALES[type ?? "four-point"];
  }

  function labelFor(type: ScaleType | undefined, value: string): string {
    return scaleFor(type).find((o) => o.value === value)?.label ?? "Not rated";
  }

  function handleGeneratePdf() {
    const sections: PdfSection[] = UNIT_ASSESSMENT_SECTIONS.map((section) => ({
      heading: section.title,
      lines: section.items.flatMap((item) => {
        const state = items[item.id];
        const lines = [
          { text: `${item.id}  ${item.text}`, bold: true },
          { text: `Rating: ${state?.rating ? labelFor(item.scale, state.rating) : "Not rated"}`, indent: 12 }
        ];
        if (state?.comment?.trim()) {
          lines.push({ text: `Comment: ${state.comment.trim()}`, indent: 12 });
        }
        return lines;
      })
    }));

    sections.push({
      heading: "Overall Comments",
      lines: [{ text: overallComments.trim() || "(none)" }]
    });

    generateFormPdf({
      title: "Unit Assessment Checklist",
      meta: `Unit: ${unitName || "—"}  ·  Inspector: ${inspectorName || "—"}  ·  Date: ${inspectionDate || "—"}  ·  Rated ${ratedItems}/${totalItems} items`,
      sections,
      filename: `unit-assessment-${inspectionDate || "draft"}.pdf`
    });
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">IG / Stan Eval Inspection</h1>
      <p className="dash-page__subtitle">
        Unit Assessment Checklist — fill out the rubric below, then generate a PDF. Nothing here is saved to the
        database; export the PDF before navigating away.
      </p>

      <p className="content-block__empty" style={{ marginBottom: 0 }}>
        <i className="fa-solid fa-triangle-exclamation" /> The checklist items below are placeholder content — swap
        in your real Section 1–5 items in <code>lib/rubric.ts</code> before using this for an actual inspection.
      </p>

      <section className="dash-card dash-card--full">
        <div className="content-box__edit" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <label className="form-label">
            Unit
            <input className="form-input" value={unitName} onChange={(e) => setUnitName(e.target.value)} />
          </label>
          <label className="form-label">
            Inspector
            <input className="form-input" placeholder="Name / role" value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} />
          </label>
          <label className="form-label">
            Inspection date
            <input className="form-input" type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
          </label>
        </div>
      </section>

      {UNIT_ASSESSMENT_SECTIONS.map((section) => (
        <section className="content-block" key={section.id}>
          <header className="content-block__header">
            <div>
              <h2 className="content-block__title">{section.title}</h2>
              {section.description && <p className="content-block__description">{section.description}</p>}
            </div>
          </header>

          <div className="content-block__boxes">
            {section.items.map((item) => {
              const state = items[item.id] ?? { rating: "", comment: "" };
              return (
                <article className="content-box" key={item.id}>
                  <div className="content-box__header">
                    <h3 className="content-box__title">
                      {item.id} — {item.text}
                    </h3>
                  </div>
                  <div className="reaction-bar" role="radiogroup" aria-label={`Rating for ${item.id}`}>
                    {scaleFor(item.scale).map((option) => (
                      <label
                        key={option.value}
                        className={`reaction-pill${state.rating === option.value ? " is-active" : ""}`}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name={`rating-${item.id}`}
                          value={option.value}
                          checked={state.rating === option.value}
                          onChange={() => setRating(item.id, option.value)}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <textarea
                    className="form-input"
                    style={{ marginTop: "0.6rem" }}
                    rows={2}
                    placeholder="Comment (optional)"
                    value={state.comment}
                    onChange={(e) => setComment(item.id, e.target.value)}
                  />
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="content-block">
        <header className="content-block__header">
          <h2 className="content-block__title">Overall Comments</h2>
        </header>
        <textarea
          className="form-input"
          rows={4}
          placeholder="Summary remarks, strengths, areas for improvement…"
          value={overallComments}
          onChange={(e) => setOverallComments(e.target.value)}
        />
      </section>

      <div className="content-block__actions">
        <button className="btn-small btn-small--primary" onClick={handleGeneratePdf}>
          <i className="fa-solid fa-file-pdf" /> Generate PDF ({ratedItems}/{totalItems} rated)
        </button>
      </div>
    </div>
  );
}
