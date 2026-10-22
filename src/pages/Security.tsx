import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

const POINTS = [
  {
    title: "Stored in Canada",
    body: "Your system and its database run in Microsoft Azure's Canada Central region (Toronto). This applies to brokerages in the United States too.",
  },
  {
    title: "Your own copy",
    body: "Each brokerage gets its own server and its own database. Your files are not mixed into a shared database with other brokerages.",
  },
  {
    title: "Encrypted in transit",
    body: "Every connection to the portal, the client portal and the apps uses HTTPS (TLS).",
  },
  {
    title: "Encrypted at rest",
    body: "The database and its backups are stored on encrypted disks managed by Azure.",
  },
  {
    title: "Automatic backups",
    body: "The database is backed up automatically by Azure every day and can be restored to an earlier point in time within the backup retention period.",
  },
  {
    title: "Signing in",
    body: "Staff and clients sign in with a one-time code sent to their phone. Pro adds single sign-on with Microsoft work accounts.",
  },
  {
    title: "Payments",
    body: "Card payments for your subscription are handled by Stripe. We never see or store your full card number.",
  },
  {
    title: "Access by our team",
    body: "Our support team only accesses your copy to set it up, keep it running, or when you ask for help.",
  },
];

export default function Security() {
  usePageMeta(
    "Security and data",
    `How ${PRODUCT_NAME} looks after your data: Canadian hosting on Azure Canada Central, a separate database per brokerage, encryption and automatic backups.`,
    "/security",
  );
  return (
    <>
      <div className="wrap page-head">
        <h1>Security and data</h1>
        <p>What we do to protect your brokerage's data, in plain terms.</p>
      </div>
      <div className="wrap">
        <div className="feature-grid">
          {POINTS.map((p) => (
            <div className="feature" key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
        <div className="callout" style={{ marginTop: "3rem" }}>
          <p>
            Your brokerage is responsible for how you collect and use your clients' information, including getting
            consent where the law requires it. If your lenders or regulators send you a security questionnaire,{" "}
            contact us and we'll help you answer it.
          </p>
        </div>
      </div>
    </>
  );
}
