/**
 * lib/rubric.ts
 *
 * ⚠️ ASSUMPTION / PLACEHOLDER: the actual Section 1–5 items and rating
 * scales from your unit's Unit Assessment Checklist weren't pasted in
 * (the request had a bracketed placeholder where that content should
 * go). Everything below is original, generic AFJROTC-style inspection
 * content I wrote to unblock the UI — it is NOT a transcription of any
 * real HQ AFJROTC / Stan Eval document. Before this is used for an
 * actual inspection, replace `UNIT_ASSESSMENT_SECTIONS` (and the rating
 * scales, if yours differ) with your real checklist. Everything that
 * consumes this file — the /dashboard/inspection page — reads entirely
 * from this static structure, so editing it here is the only change
 * needed to swap in the real content; no other file needs to change.
 */

export type ScaleType = "four-point" | "yes-no-na";

export type RatingOption = { value: string; label: string };

export const RATING_SCALES: Record<ScaleType, RatingOption[]> = {
  "four-point": [
    { value: "4", label: "4 — Exceeds Standard" },
    { value: "3", label: "3 — Meets Standard" },
    { value: "2", label: "2 — Needs Improvement" },
    { value: "1", label: "1 — Unsatisfactory" },
    { value: "na", label: "N/A" }
  ],
  "yes-no-na": [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "na", label: "N/A" }
  ]
};

export type RubricItem = {
  id: string;
  text: string;
  /** Defaults to "four-point" when omitted. */
  scale?: ScaleType;
};

export type RubricSection = {
  id: string;
  title: string;
  description?: string;
  items: RubricItem[];
};

export const UNIT_ASSESSMENT_SECTIONS: RubricSection[] = [
  {
    id: "section-1",
    title: "Section 1 — Administration & Records",
    description: "Cadet records, attendance, and required documentation are current and accurate.",
    items: [
      { id: "1.1", text: "Cadet personnel records are complete and up to date.", scale: "four-point" },
      { id: "1.2", text: "Attendance records are maintained accurately and consistently.", scale: "four-point" },
      { id: "1.3", text: "Required unit files (SAV history, correspondence, budgets) are organized and accessible.", scale: "four-point" },
      { id: "1.4", text: "Cadet emergency contact and medical information is on file for all cadets.", scale: "yes-no-na" },
      { id: "1.5", text: "Enrollment and withdrawal paperwork is processed within required timelines.", scale: "four-point" }
    ]
  },
  {
    id: "section-2",
    title: "Section 2 — Instruction & Training",
    description: "Curriculum delivery, lesson planning, and cadet academic performance.",
    items: [
      { id: "2.1", text: "Lesson plans are on file and aligned to the required curriculum sequence.", scale: "four-point" },
      { id: "2.2", text: "Instruction incorporates a variety of teaching methods appropriate to the material.", scale: "four-point" },
      { id: "2.3", text: "Cadet assessments/grades are recorded and reflect course objectives.", scale: "four-point" },
      { id: "2.4", text: "Leadership Education courses are taught in the proper sequence for cadet grade level.", scale: "yes-no-na" },
      { id: "2.5", text: "Instructors model professionalism and maintain classroom standards.", scale: "four-point" }
    ]
  },
  {
    id: "section-3",
    title: "Section 3 — Cadet Corps & Leadership",
    description: "Cadet chain of command, drill proficiency, and leadership development.",
    items: [
      { id: "3.1", text: "A functioning cadet chain of command is established and documented.", scale: "yes-no-na" },
      { id: "3.2", text: "Cadets demonstrate proficiency in basic drill and ceremonies.", scale: "four-point" },
      { id: "3.3", text: "Cadet leadership positions rotate to provide broad leadership opportunity.", scale: "four-point" },
      { id: "3.4", text: "Cadets can articulate the AFJROTC mission and core values.", scale: "four-point" },
      { id: "3.5", text: "LDR teams/activities are active and cadets participate broadly across the corps.", scale: "four-point" }
    ]
  },
  {
    id: "section-4",
    title: "Section 4 — Supply, Uniforms & Facilities",
    description: "Uniform issue/condition, equipment accountability, and classroom/supply room condition.",
    items: [
      { id: "4.1", text: "Uniform issue records match cadets currently enrolled.", scale: "four-point" },
      { id: "4.2", text: "Issued uniforms are serviceable and properly sized.", scale: "four-point" },
      { id: "4.3", text: "Equipment/supply inventory is current and reconciled against on-hand stock.", scale: "four-point" },
      { id: "4.4", text: "Classroom, supply room, and storage areas are clean, organized, and safe.", scale: "four-point" },
      { id: "4.5", text: "Sensitive-item inventory (if applicable) has proper accountability controls.", scale: "yes-no-na" }
    ]
  },
  {
    id: "section-5",
    title: "Section 5 — Community Involvement & Public Relations",
    description: "Community service, unit visibility, and relationships with school/community stakeholders.",
    items: [
      { id: "5.1", text: "The unit participates in community service activities throughout the school year.", scale: "four-point" },
      { id: "5.2", text: "The unit maintains positive visibility (school events, local media, unit website/socials).", scale: "four-point" },
      { id: "5.3", text: "The unit maintains a productive relationship with school administration.", scale: "four-point" },
      { id: "5.4", text: "Parent/community engagement opportunities (Awards Ceremony, Military Ball, etc.) are planned and executed.", scale: "four-point" },
      { id: "5.5", text: "Recruiting/retention efforts are active and documented.", scale: "four-point" }
    ]
  }
];
