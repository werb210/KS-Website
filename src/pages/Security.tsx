import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

type Point = { title: string; body: string };

// Only what the system actually does. Keep in step with KS-server and KS-Ops (see the KS-Website PR that added this
// list for the code behind each line) - never add a promise the code does not keep.
const HOSTING: Point[] = [
  {
    title: "Stored in Canada",
    body: "Keystone's servers and your database run in Microsoft Azure's Canada Central region (Toronto). This applies to brokerages in the United States too.",
  },
  {
    title: "Your own private database",
    body: "Each brokerage gets its own private database, with its own login that cannot open any other brokerage's database. Your records are never mixed into a shared database with other brokerages.",
  },
  {
    title: "Encrypted in transit",
    body: "Every connection to the portal, the client portal and the apps uses HTTPS (TLS 1.2 or later), and the server talks to its database over an encrypted connection.",
  },
  {
    title: "Encrypted at rest",
    body: "The database and its backups are stored on encrypted disks managed by Azure. SIN and SSN numbers saved on a contact are encrypted again on their own (AES-256).",
  },
  {
    title: "Automatic backups",
    body: "The database is backed up automatically by Azure every day and can be restored to an earlier point in time within the backup retention period.",
  },
];

const RECORDS: Point[] = [
  {
    title: "Records kept for 7 years",
    body: "Applications, uploaded documents, signed agreements, lender packages and the audit log are locked for 7 years from the later of the upload and the file closing (funded, declined or withdrawn). Delete buttons show a lock and the first date the record can be deleted, and the server refuses earlier deletes.",
  },
  {
    title: "Legal holds",
    body: "An Admin can place a legal hold on an application, contact or company, with a reason. Nothing under a hold can be deleted or purged until an Admin releases it. Placing and releasing a hold is recorded in the audit log.",
  },
  {
    title: "Nothing deleted automatically",
    body: "After 7 years a record becomes eligible for deletion and is listed in the Admin Retention report. It is only deleted when an Admin chooses to.",
  },
  {
    title: "SIN and SSN removed after signing",
    body: "Once every signer has signed an application, the SIN or SSN numbers on it are deleted from the application.",
  },
  {
    title: "Audit log",
    body: "Sign-ins, one-time code checks, new users and role changes, pipeline moves, document uploads, report exports and legal holds are recorded with who did it and when. Audit entries cannot be deleted for 7 years.",
  },
  {
    title: "Consent records",
    body: "Each contact keeps how and when they gave consent to be contacted, and where it came from. Applicants accept your terms in the application, and outside callers hear a notice before a recorded call connects.",
  },
  {
    title: "Export your data any time",
    body: "An Admin can download everything in your copy, every record and uploaded file, as one zip file. It stays available after you cancel.",
  },
  {
    title: "Cancelling: 6 months, then deleted - except retained records",
    body: "If you cancel, your data is kept for 180 days so you can download it, and your Admins are emailed 7 days and 1 day before it is deleted. Records still inside their 7 years, or under a legal hold, are not destroyed: they are kept read-only and encrypted, out of use, and deleted when their 7 years are up. We can provide a copy on your written request.",
  },
];

// KS_WEBSITE_OVERHAUL - the texting, calling and privacy rules KS-server enforces (src/services/smsConsent.ts,
// src/routes/smsInboundWebhook.ts, src/phone/textingState.ts, src/modules/automation/, src/privacy/, KS-Client's
// Quebec consent mode).
const MESSAGING: Point[] = [
  {
    title: "Texting consent (CASL)",
    body: "Marketing texts only go to people who gave express consent, or implied consent that hasn't expired: 2 years after a transaction, 6 months after an enquiry. Anyone who opted out is skipped, and bulk marketing texts go to Canadian mobiles only.",
  },
  {
    title: "STOP means stop",
    body: "A reply of STOP, UNSUBSCRIBE or similar opts the person out of texts straight away and is confirmed; START opts them back in. Opt-outs are honoured even from blocked numbers.",
  },
  {
    title: "Quiet hours in your time zone",
    body: "Automations and sequences hold texts and emails until the allowed hours, counted in your brokerage's own time zone.",
  },
  {
    title: "Registered US texting",
    body: "Texts to US mobiles go from your own toll-free line once its verification is approved, or your US business line once A2P 10DLC registration is approved. Until then they wait instead of going out unregistered. Canadian texts are never held.",
  },
  {
    title: "Call-recording notice",
    body: "Calls are recorded on every plan, and outside callers hear a notice before a recorded call connects.",
  },
  {
    title: "Blocked numbers",
    body: "An Admin can block a number. A blocked caller never rings your staff, and their texts are ignored and logged.",
  },
];

const PRIVACY: Point[] = [
  {
    title: "Privacy requests (PIPEDA and Law 25)",
    body: "Admins record access, correction and deletion requests against a contact, with a 30-day due date. Access exports what's held as a file; corrections are logged with the old and new values; a deletion keeps only what the 7-year rule or a legal hold protects, and opts the person out of marketing.",
  },
  {
    title: "Quebec consent",
    body: "Your client app waits for consent before loading Google tags for visitors in Quebec, as Law 25 requires.",
  },
  {
    title: "Cookie choices recorded",
    body: "Each visitor's choice is recorded by category before visitor tracking or session replay loads. Their address is kept only as a scrambled hash.",
  },
  {
    title: "Mail you never want logged",
    body: "Admins list email addresses and domains, like a lawyer's or an accountant's, whose mail is never copied into the CRM automatically.",
  },
];

const ACCESS: Point[] = [
  {
    title: "Signing in",
    body: "No passwords: staff and clients sign in with a one-time code sent to their phone, then a passkey or Face ID on their device. Pro adds single sign-on with Microsoft or Google work accounts.",
  },
  {
    title: "Required two-step sign-in",
    body: "An Admin can require a passkey or two-step sign-in for every staff member, see where each person is signed in, and sign a device or everyone out.",
  },
  {
    title: "Roles",
    body: "Admins manage the account, users and settings, and staff work their deals. Lenders and referrers sign in to their own portals, separate from your staff portal.",
  },
  {
    title: "Teams and record visibility",
    body: "On Growth and Pro, choose who sees all records, their team's, or only their own: in lists, search, reports, exports and the assistant.",
  },
  {
    title: "Fraud checks",
    body: "Every application is checked before it goes to a lender: document tampering, bank statement math and duplicate documents on every plan, with more checks on Growth and Pro.",
  },
  {
    title: "Payments",
    body: "Bank debit and card payments for your subscription are handled by Stripe. We never see or store your full card or bank account number.",
  },
  {
    title: "Access by our team",
    body: "Our support team only accesses your copy to set it up, keep it running, or when you ask for help.",
  },
];

function Group({ id, title, points }: { id: string; title: string; points: Point[] }) {
  return (
    <section aria-labelledby={`${id}-h`} id={id} className="sec-group">
      <h2 id={`${id}-h`}>
        {title}
      </h2>
      <div className="feature-grid">
        {points.map((p) => (
          <div className="feature" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Security() {
  usePageMeta(
    "Security and compliance",
    `How ${PRODUCT_NAME} looks after your data and enforces the rules: Canadian hosting, a separate database per brokerage, encryption, 7-year retention and legal holds, CASL texting consent and quiet hours, US texting registration, call-recording notices, privacy requests for PIPEDA and Law 25, audit logs and passkeys.`,
    "/security",
  );
  return (
    <>
      <div className="wrap page-head">
        <h1>Security and compliance</h1>
        <p className="lede">
          What the system enforces to protect your brokerage's data and help you meet your duties under PIPEDA, Quebec's
          Law 25, CASL and US texting rules, in plain terms.
        </p>
        <nav aria-label="On this page" className="chips">
          <a className="chip" href="#sec-hosting">Where your data lives</a>
          <a className="chip" href="#sec-records">Records and retention</a>
          <a className="chip" href="#sec-messaging">Texting and calling</a>
          <a className="chip" href="#sec-privacy">Privacy and consent</a>
          <a className="chip" href="#sec-access">Access and fraud</a>
        </nav>
      </div>
      <div className="wrap">
        <Group id="sec-hosting" title="Where your data lives" points={HOSTING} />
        <Group id="sec-records" title="Records and retention" points={RECORDS} />
        <Group id="sec-messaging" title="Texting and calling rules" points={MESSAGING} />
        <Group id="sec-privacy" title="Privacy and consent" points={PRIVACY} />
        <Group id="sec-access" title="Access and fraud" points={ACCESS} />
        <p>
          More on the checks in <Link to="/fraud-protection">fraud protection</Link>.
        </p>
        <div className="callout" style={{ marginTop: "2rem" }}>
          <p>
            Your brokerage is responsible for how you collect and use your clients' information, including getting
            consent where the law requires it and deciding how long you keep records. If your lenders or regulators
            send you a security questionnaire, contact us and we'll help you answer it.
          </p>
        </div>
      </div>
    </>
  );
}
