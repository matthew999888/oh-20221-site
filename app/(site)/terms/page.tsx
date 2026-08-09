import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../PageHeader";
import { CONTACTS, POLICY_LAST_UPDATED, UNIT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms governing use of the OH-20221 AFJROTC website and cadet portal, including acceptable use and account rules."
};

const SECTIONS = [
  ["acceptance", "Acceptance of these terms"],
  ["purpose", "Purpose of this site"],
  ["accounts", "Cadet portal accounts"],
  ["acceptable", "Acceptable use"],
  ["content", "Content and intellectual property"],
  ["usaf", "U.S. Air Force and DoD marks"],
  ["links", "Links to other websites"],
  ["accuracy", "Accuracy of information"],
  ["records", "Public records"],
  ["disclaimer", "Disclaimer and limitation of liability"],
  ["termination", "Suspension and termination"],
  ["law", "Governing law"],
  ["contact", "Questions"]
] as const;

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        lede={`The rules for using the ${UNIT.designation} AFJROTC website and cadet portal.`}
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          <p className="pub-updated">Last updated: {POLICY_LAST_UPDATED}</p>

          <nav className="pub-toc" aria-labelledby="toc-heading">
            <h2 className="pub-toc__title" id="toc-heading">
              On this page
            </h2>
            <ol>
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="pub-prose">
            <h2 id="acceptance">Acceptance of these terms</h2>
            <p>
              By using this website you agree to these Terms of Use and to our{" "}
              <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use
              the site. If you are under 18, review these terms with a parent or guardian.
            </p>

            <h2 id="purpose">Purpose of this site</h2>
            <p>
              This site supports the {UNIT.designation} {UNIT.program} unit at {UNIT.school}, part
              of the {UNIT.district}. The public pages share unit news, schedules, photographs, and
              general information. The cadet portal is a limited-access tool for enrolled cadets
              and instructor staff to manage unit business.
            </p>
            <p>
              This site is <strong>not</strong> a public forum. The {UNIT.district} reserves the
              right to determine what content appears here.
            </p>

            <h2 id="accounts">Cadet portal accounts</h2>
            <p>Portal accounts are issued to enrolled cadets and instructor staff only.</p>
            <ul>
              <li>
                Account requests are reviewed by instructor staff. Access is granted only after
                approval and role assignment.
              </li>
              <li>
                You must provide accurate information when requesting an account, and you must be
                at least 13 years old.
              </li>
              <li>
                You are responsible for keeping your password confidential and for all activity
                under your account. Do not share credentials.
              </li>
              <li>
                Tell an instructor immediately if you believe your account has been accessed by
                someone else.
              </li>
              <li>
                Accounts remain unit property and may be suspended or removed when a cadet leaves
                the program.
              </li>
            </ul>

            <h2 id="acceptable">Acceptable use</h2>
            <p>When using this site, you agree not to:</p>
            <ul>
              <li>Access, or try to access, any account, record, or area you are not authorized to use</li>
              <li>
                Probe, scan, or test the security of the site, or attempt to defeat rate limiting,
                bot verification, or access controls
              </li>
              <li>
                Use automated tools to scrape, harvest, or bulk-download content, particularly the
                cadet roster
              </li>
              <li>Upload or submit anything unlawful, harassing, threatening, defamatory, or obscene</li>
              <li>Impersonate another cadet, instructor, or district employee</li>
              <li>
                Republish student names or photographs taken from this site in any way that would
                embarrass, endanger, or harass a student
              </li>
              <li>Interfere with the operation of the site or the school&rsquo;s network</li>
              <li>
                Use the site in a way that violates the {UNIT.district}&rsquo;s Acceptable Use
                Policy or student code of conduct
              </li>
            </ul>
            <p>
              Cadets remain subject to school discipline for misuse. Misuse may also violate state
              or federal computer-crime law.
            </p>

            <h2 id="content">Content and intellectual property</h2>
            <p>
              Content on this site — text, layout, photographs, and unit insignia — is owned by the{" "}
              {UNIT.district} or used with permission, except where noted. You may view, print, and
              share pages for personal, educational, or non-commercial purposes with attribution.
              Commercial use, or reuse of student photographs outside the school community,
              requires written permission.
            </p>
            <p>
              If you believe content here infringes your copyright, contact the instructor staff
              with enough detail to identify the work and its location, and we will review it.
            </p>

            <h2 id="usaf">U.S. Air Force and DoD marks</h2>
            <p>
              AFJROTC is a citizenship program of the United States Air Force administered through
              the school district. <strong>This is not an official U.S. Air Force or Department of
              Defense website.</strong> The appearance of USAF or DoD visual information, insignia,
              or terminology does not imply or constitute endorsement of this site or of any
              non-federal entity, product, or service.
            </p>
            <p>
              Enrollment in AFJROTC carries <strong>no obligation</strong> to serve in the armed
              forces. AFJROTC is not a recruiting program.
            </p>

            <h2 id="links">Links to other websites</h2>
            <p>
              This site links to resources hosted elsewhere. Those sites are not under our control.
              We are not responsible for their content, availability, accuracy, privacy practices,
              or accessibility, and a link is not an endorsement. Review the terms and privacy
              policy of any site you visit.
            </p>

            <h2 id="accuracy">Accuracy of information</h2>
            <p>
              We work to keep schedules, announcements, and rosters current, but details change —
              especially event times and locations. Nothing here is guaranteed accurate or
              complete. Confirm time-sensitive information with instructor staff before relying on
              it.
            </p>

            <h2 id="records">Public records</h2>
            <p>
              As part of a public school district, some information submitted to us may be a public
              record subject to disclosure under Ohio&rsquo;s Public Records Act (Ohio Rev. Code §
              149.43), subject to FERPA and other applicable exemptions for student records.
            </p>

            <h2 id="disclaimer">Disclaimer and limitation of liability</h2>
            <p>
              This site is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
              warranties of any kind, express or implied, including merchantability, fitness for a
              particular purpose, and non-infringement. We do not warrant that the site will be
              uninterrupted, secure, or error-free.
            </p>
            <p>
              To the fullest extent permitted by law, the {UNIT.district}, its board members,
              employees, and volunteers are not liable for any indirect, incidental, or
              consequential damages arising from use of this site. Nothing in these terms waives
              any immunity or defense available to a political subdivision under Ohio Rev. Code
              Chapter 2744 or other applicable law.
            </p>

            <h2 id="termination">Suspension and termination</h2>
            <p>
              We may suspend or terminate access to the cadet portal at any time, with or without
              notice, for violation of these terms, for misuse, or when a cadet is no longer
              enrolled in the program.
            </p>

            <h2 id="law">Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Ohio and applicable federal law,
              without regard to conflict-of-law rules. Any action relating to this site shall be
              brought in the state courts of Hocking County, Ohio.
            </p>

            <h2 id="contact">Questions</h2>
            <p>
              {CONTACTS.sasi.name}, {CONTACTS.sasi.title} —{" "}
              <a href={`mailto:${CONTACTS.sasi.email}`}>{CONTACTS.sasi.email}</a>
              <br />
              {CONTACTS.asi.name}, {CONTACTS.asi.title} —{" "}
              <a href={`mailto:${CONTACTS.asi.email}`}>{CONTACTS.asi.email}</a>
            </p>

            {/* NOTE FOR MAINTAINERS (removed from the public page at the
                unit's request, kept here so it is not lost):
                These terms were written to match how the site actually
                behaves, but they have NOT been reviewed by an attorney.
                The liability, governing law, and public records sections
                in particular should be checked by the district
                administration or counsel. */}
          </div>
        </div>
      </div>
    </>
  );
}
