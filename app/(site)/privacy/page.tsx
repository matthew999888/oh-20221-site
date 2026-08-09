import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "../PageHeader";
import { CONTACTS, POLICY_LAST_UPDATED, SUBPROCESSORS, UNIT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How OH-20221 AFJROTC collects, uses, and protects information on this website, including student education records under FERPA."
};

const SECTIONS = [
  ["scope", "Who this policy covers"],
  ["collect", "Information we collect"],
  ["ferpa", "Student records and FERPA"],
  ["directory", "Directory information and opt-out"],
  ["children", "Children under 13 (COPPA)"],
  ["use", "How we use information"],
  ["share", "Who we share information with"],
  ["cookies", "Cookies and session storage"],
  ["retention", "How long we keep information"],
  ["security", "How we protect information"],
  ["rights", "Your rights and choices"],
  ["changes", "Changes to this policy"],
  ["contact", "How to contact us"]
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        lede={`How ${UNIT.designation} AFJROTC handles information collected through this website.`}
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
            <h2 id="scope">Who this policy covers</h2>
            <p>
              This website is operated by the {UNIT.designation} {UNIT.program} unit at{" "}
              {UNIT.school}, part of the {UNIT.district}. It has two parts: a{" "}
              <strong>public site</strong> that anyone can visit, and a password-protected{" "}
              <strong>cadet portal</strong> for enrolled cadets and instructor staff.
            </p>
            <p>
              Because we are a public school program, the way we handle student information is
              governed primarily by the Family Educational Rights and Privacy Act (FERPA) and by
              the {UNIT.district}&rsquo;s own board policies. Where this notice and a district
              policy differ, the district policy controls.
            </p>

            <h2 id="collect">Information we collect</h2>
            <h3>When you browse the public site</h3>
            <p>
              You do not need an account to read the public pages. Our hosting and security
              providers automatically record limited technical information for every request,
              including your IP address, the page requested, the date and time, and your browser
              and device type. This is used to deliver the site, keep it available, and detect
              abuse.
            </p>
            <h3>When you request a cadet portal account</h3>
            <p>We ask for, and store:</p>
            <ul>
              <li>Your full name</li>
              <li>Your email address</li>
              <li>A password, which is stored only as a one-way cryptographic hash</li>
              <li>Your confirmation that you are 13 or older</li>
            </ul>
            <p>
              New accounts are created in a <strong>pending</strong> state and cannot access the
              portal until an instructor reviews and approves them.
            </p>
            <h3>Inside the cadet portal</h3>
            <p>
              For enrolled cadets, the portal holds records related to participation in the
              AFJROTC program, which may include rank and position, flight assignment, grade
              level, event attendance and service hours, uniform and equipment issue, promotion
              test results, evaluations, and staff journal submissions. We also keep an activity
              log of significant staff actions for accountability.
            </p>

            <h2 id="ferpa">Student records and FERPA</h2>
            <p>
              Records in the cadet portal that are directly related to a student and maintained by
              the school are <strong>education records</strong> under FERPA (20 U.S.C. § 1232g; 34
              CFR Part 99). We do not sell education records, use them for advertising, or
              disclose them except as FERPA permits — for example, to school officials with a
              legitimate educational interest, or with written consent.
            </p>
            <p>Parents, and students who are 18 or older (&ldquo;eligible students&rdquo;), have the right to:</p>
            <ul>
              <li>Inspect and review the student&rsquo;s education records</li>
              <li>Request correction of records believed to be inaccurate or misleading</li>
              <li>
                Consent to disclosures of personally identifiable information, except where FERPA
                authorizes disclosure without consent
              </li>
              <li>
                File a complaint with the U.S. Department of Education&rsquo;s Student Privacy
                Policy Office
              </li>
            </ul>
            <p>
              Ohio law additionally restricts release of student personally identifiable
              information (Ohio Rev. Code § 3319.321). To exercise any of these rights, contact
              the instructor staff listed below or the district records custodian.
            </p>

            <h2 id="directory">Directory information and opt-out</h2>
            <p>
              The public <Link href="/roster">Cadet Roster</Link> page lists cadet name, rank,
              grade level, flight, and position. Photographs of cadets appear in the public{" "}
              <Link href="/gallery">Gallery</Link>. We publish these as{" "}
              <strong>directory information</strong>, which FERPA allows a school to disclose
              without consent — but only if families are given notice and a reasonable chance to
              refuse (34 CFR § 99.37).
            </p>
            <div className="pub-callout">
              <strong>To opt out:</strong> a parent, guardian, or eligible student may ask that a
              cadet not appear on the public roster or in public photographs. Email{" "}
              <a href={`mailto:${CONTACTS.sasi.email}`}>{CONTACTS.sasi.email}</a> with the
              cadet&rsquo;s name. We will remove them from the public roster and from public photo
              galleries. Opting out does not affect the cadet&rsquo;s participation in the program
              or their records inside the portal.
            </div>
            <p>
              If your family already filed a directory-information opt-out with the{" "}
              {UNIT.district}, that opt-out applies here too — but please tell the instructor staff
              so we can apply it to this site promptly.
            </p>

            <h2 id="children">Children under 13 (COPPA)</h2>
            <p>
              This site is intended for high school students, instructor staff, and families. We
              do not knowingly create portal accounts for children under 13, and account requests
              require the applicant to confirm they are 13 or older. If we learn that we have
              collected personal information from a child under 13 without the school-authorized
              consent required by the Children&rsquo;s Online Privacy Protection Act, we will
              delete it. If you believe a child under 13 has created an account, contact us using
              the details below.
            </p>

            <h2 id="use">How we use information</h2>
            <ul>
              <li>To operate the public site and the cadet portal</li>
              <li>To authenticate members and control who can see or edit what</li>
              <li>To administer the AFJROTC program — attendance, service hours, promotions, inventory, and evaluations</li>
              <li>To communicate unit news, schedules, and announcements</li>
              <li>To secure the site against automated abuse, credential-stuffing, and spam</li>
              <li>To meet legal, audit, and district record-keeping obligations</li>
            </ul>
            <p>
              We do <strong>not</strong> sell personal information, share it with advertisers, use
              it to build advertising profiles, or use automated decision-making that produces
              legal effects.
            </p>

            <h2 id="share">Who we share information with</h2>
            <p>
              Beyond disclosures permitted by FERPA, information is processed by the service
              providers we rely on to run the site. Each acts on our instructions:
            </p>
            <dl>
              {SUBPROCESSORS.map((s) => (
                <div key={s.name}>
                  <dt>{s.name}</dt>
                  <dd>
                    {s.purpose}. Data involved: {s.data.toLowerCase()}.
                  </dd>
                </div>
              ))}
            </dl>
            <p>
              We may also disclose information where required by law, court order, or public
              records obligations, or to protect the safety of students and staff.
            </p>

            <h2 id="cookies">Cookies and session storage</h2>
            <p>
              This site uses <strong>strictly necessary cookies only</strong>. We do not use
              advertising, analytics, or cross-site tracking cookies, so no consent banner is
              required.
            </p>
            <ul>
              <li>
                <strong>Session cookie.</strong> Set when you sign in, so the site knows you are
                logged in. It is removed when you sign out or when the session expires.
              </li>
              <li>
                <strong>CSRF token cookie.</strong> Set by the sign-in system to prevent
                cross-site request forgery.
              </li>
              <li>
                <strong>Cloudflare Turnstile.</strong> Used on the sign-in and account request
                forms to tell humans from bots. Turnstile is designed as a privacy-preserving
                alternative to CAPTCHA and is not used to track you across sites.
              </li>
            </ul>
            <p>
              Because these cookies are essential to signing in, blocking them will prevent the
              cadet portal from working. Public pages remain readable without them.
            </p>

            <h2 id="retention">How long we keep information</h2>
            <p>
              Education records are retained and disposed of according to the {UNIT.district}
              &rsquo;s records retention schedule and Ohio public records law. Account records for
              cadets who leave the program are deactivated and then removed in line with that
              schedule. Rate-limit counters expire automatically within minutes to hours. Security
              and request logs held by our providers are kept for a short period and then deleted.
            </p>

            <h2 id="security">How we protect information</h2>
            <p>
              All traffic is encrypted in transit with HTTPS. Passwords are stored only as salted
              one-way hashes, never in readable form. Access inside the portal is limited by role,
              so cadets see only what their position requires. Sign-in and submission endpoints
              are rate limited and protected by bot verification. New accounts require staff
              approval before any access is granted.
            </p>
            <p>
              No system is perfectly secure. If you believe an account or record has been exposed,
              contact the instructor staff immediately.
            </p>

            <h2 id="rights">Your rights and choices</h2>
            <ul>
              <li>Ask to see, correct, or discuss any record we hold about a cadet</li>
              <li>Opt out of the public roster and public photographs at any time</li>
              <li>Ask that a specific photograph be removed from the gallery</li>
              <li>Ask us to deactivate a portal account</li>
              <li>
                File a FERPA complaint with the Student Privacy Policy Office, U.S. Department of
                Education, 400 Maryland Avenue SW, Washington, DC 20202
              </li>
            </ul>

            <h2 id="changes">Changes to this policy</h2>
            <p>
              We will update this page when our practices change and revise the &ldquo;last
              updated&rdquo; date above. Material changes affecting student records will also be
              communicated through the unit&rsquo;s normal channels.
            </p>

            <h2 id="contact">How to contact us</h2>
            <p>
              {UNIT.designation} AFJROTC
              <br />
              {UNIT.school}
              <br />
              {UNIT.address.street}
              <br />
              {UNIT.address.city}, {UNIT.address.state} {UNIT.address.zip}
            </p>
            <p>
              {CONTACTS.sasi.name}, {CONTACTS.sasi.title} —{" "}
              <a href={`mailto:${CONTACTS.sasi.email}`}>{CONTACTS.sasi.email}</a>
              <br />
              {CONTACTS.asi.name}, {CONTACTS.asi.title} —{" "}
              <a href={`mailto:${CONTACTS.asi.email}`}>{CONTACTS.asi.email}</a>
            </p>

            {/* NOTE FOR MAINTAINERS (removed from the public page at the
                unit's request, kept here so it is not lost):
                This policy was written to match how the site actually
                behaves, but it has NOT been reviewed by an attorney.
                It should be checked by the district administration or
                counsel against board policy, the annual FERPA notice,
                and the records retention schedule. */}
          </div>
        </div>
      </div>
    </>
  );
}
