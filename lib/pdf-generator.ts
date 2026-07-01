"use client";

import { jsPDF } from "jspdf";

/**
 * Minimal, dependency-light text layout for jsPDF: a title, an optional
 * meta line (e.g. "Generated 6/30/2026, 3:45 PM"), and a list of section
 * blocks, each with a heading and body lines. Handles word-wrapping and
 * page breaks. No table/grid layout — this is intentionally simple since
 * both forms it powers are just labeled fields + comments, not tabular
 * data.
 */

export type PdfLine = { text: string; indent?: number; bold?: boolean };
export type PdfSection = { heading: string; lines: PdfLine[] };

const PAGE_WIDTH = 612; // 8.5in @ 72dpi (jsPDF default "pt" unit, "letter" format)
const PAGE_HEIGHT = 792; // 11in
const MARGIN = 54; // 0.75in
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function generateFormPdf(opts: { title: string; meta?: string; sections: PdfSection[]; filename: string }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  let y = MARGIN;

  function ensureSpace(next: number) {
    if (y + next > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(opts.title, MARGIN, y);
  y += 24;

  if (opts.meta) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(opts.meta, MARGIN, y);
    doc.setTextColor(0, 0, 0);
    y += 20;
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 18;

  for (const section of opts.sections) {
    ensureSpace(26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(section.heading, MARGIN, y);
    y += 18;

    for (const line of section.lines) {
      const indent = line.indent ?? 0;
      doc.setFont("helvetica", line.bold ? "bold" : "normal");
      doc.setFontSize(10.5);
      const wrapped = doc.splitTextToSize(line.text, CONTENT_WIDTH - indent) as string[];
      for (const w of wrapped) {
        ensureSpace(14);
        doc.text(w, MARGIN + indent, y);
        y += 14;
      }
    }
    y += 10;
  }

  doc.save(opts.filename);
}
