import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

type Point = { title: string; body: string };

// Only what the system actually does. Keep in step with KS-server and KS-Ops (see the KS-Website PR that added this
// list for the code behind each line) - never add a promise the code does not keep.
const HOSTING: Point[] = [
  {
    title: "Stored in Canada",
    body: "Your server and its database run in Microsoft Azure's Canada Central region (Toronto). This applies to brokerages in the United States too.",
  },
  {
    title: "Your own copy",
    body: "Each brokerage gets its own server and its own database. Your files are not mixed into a shared database with other brokerages.",
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

const ACCESS: Point[] = [
  {
    title: "Signing in",
    body: "Staff and clients sign in with a one-time code sent to their phone. Pro adds single sign-on with Microsoft work accounts.",
  },
  {
    title: "Roles",
    body: "Admins manage the account, users and settings, and staff work their deals. Lenders and referrers sign in to their own portals, separate from your staff portal.",
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
    <section aria-labelledby={id} style={{ marginBottom: "3rem" }}>
      <h2 id={id} style={{ fontSize: "var(--step-2)" }}>
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
    "Security and data",
    `How ${PRODUCT_NAME} looks after your data: Canadian hosting, a separate database per brokerage, encryption, audit logs, consent records, SIN removal after signing, data export and a 180-day hold before deletion.`,
    "/security",
  );
  return (
    <>
      <div className="wrap page-head">
        <h1>Security and data</h1>
        <p>What we do to protect your brokerage's data and help you meet your compliance duties, in plain terms.</p>
      </div>
      <div className="wrap">
        <Group id="sec-hosting" title="Where your data lives" points={HOSTING} />
        <Group id="sec-records" title="Records, retention and privacy" points={RECORDS} />
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
