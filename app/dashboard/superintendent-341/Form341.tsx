"use client";

import { useState } from "react";
import { generateFormPdf } from "@/lib/pdf-generator";

/**
 * ⚠️ ASSUMPTION: "the Superintendent 341 page" wasn't accompanied by a
 * real Form 341 layout, so the fields below (name, description, a
 * Good/Bad assessment toggle, an Approved/Denied decision) are exactly
 * what the task described and nothing more. Extend this if your real
 * Form 341 has additional fields. Like the inspection sheet, this is
 * pure client state — nothing here is written to the database.
 */
export default function Form341() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [assessment, setAssessment] = useState<"good" | "bad">("good");
  const [decision, setDecision] = useState<"approved" | "denied" | "">("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));

  function handleGeneratePdf() {
    generateFormPdf({
      title: "AFJROTC Form 341",
      meta: `Date: ${formDate || "—"}`,
      sections: [
        {
          heading: "Details",
          lines: [
            { text: "Name:", bold: true },
            { text: name.trim() || "—", indent: 12 },
            { text: "Description:", bold: true },
            { text: description.trim() || "—", indent: 12 }
          ]
        },
        {
          heading: "Assessment",
          lines: [{ text: assessment === "good" ? "GOOD" : "BAD", bold: true, indent: 12 }]
        },
        {
          heading: "Decision",
          lines: [
            {
              text: decision ? (decision === "approved" ? "APPROVED" : "DENIED") : "Not yet decided",
              bold: true,
              indent: 12
            }
          ]
        }
      ],
      filename: `form-341-${(name.trim() || "untitled").toLowerCase().replace(/\s+/g, "-")}.pdf`
    });
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Superintendent — Form 341</h1>
      <p className="dash-page__subtitle">
        Fill out the form below, then generate a PDF. Nothing here is saved to the database.
      </p>

      <section className="dash-card dash-card--full">
        <div className="content-box__edit">
          <label className="form-label">
            Date
            <input className="form-input" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </label>
          <label className="form-label">
            Name
            <input className="form-input" placeholder="Cadet or item name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="form-label">
            Description
            <textarea
              className="form-input"
              rows={5}
              placeholder="Describe the situation, incident, or item being assessed…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div>
            <p className="form-label" style={{ marginBottom: "0.4rem" }}>
              Assessment
            </p>
            <div className="reaction-bar" role="radiogroup" aria-label="Assessment">
              <label className={`reaction-pill${assessment === "good" ? " is-active" : ""}`} style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="assessment"
                  checked={assessment === "good"}
                  onChange={() => setAssessment("good")}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <i className="fa-solid fa-thumbs-up" /> Good
              </label>
              <label className={`reaction-pill${assessment === "bad" ? " is-active" : ""}`} style={{ cursor: "pointer" }}>
                <input
                  type="radio"
                  name="assessment"
                  checked={assessment === "bad"}
                  onChange={() => setAssessment("bad")}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <i className="fa-solid fa-thumbs-down" /> Bad
              </label>
            </div>
          </div>

          <div>
            <p className="form-label" style={{ marginBottom: "0.4rem" }}>
              Decision
            </p>
            <div className="reaction-bar">
              <label className={`reaction-pill${decision === "approved" ? " is-active" : ""}`} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={decision === "approved"}
                  onChange={() => setDecision((d) => (d === "approved" ? "" : "approved"))}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <i className="fa-solid fa-check" /> Approved
              </label>
              <label className={`reaction-pill${decision === "denied" ? " is-active" : ""}`} style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={decision === "denied"}
                  onChange={() => setDecision((d) => (d === "denied" ? "" : "denied"))}
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                />
                <i className="fa-solid fa-xmark" /> Denied
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="content-block__actions">
        <button className="btn-small btn-small--primary" onClick={handleGeneratePdf}>
          <i className="fa-solid fa-file-pdf" /> Generate PDF
        </button>
      </div>
    </div>
  );
}
