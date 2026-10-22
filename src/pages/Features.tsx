import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

type Item = { name: string; body: string; plan?: "Growth" | "Pro" };
type Area = { title: string; intro: string; items: Item[] };

const AREAS: Area[] = [
  {
    title: "Pipeline and CRM",
    intro: "Where your deals live.",
    items: [
      { name: "Pipeline", body: "Drag deals through your stages, see what's stuck and who owns it." },
      { name: "Contacts and companies", body: "Borrowers, referrers and lenders with every call, text, email and document in one timeline." },
      { name: "Tasks and calendar", body: "Follow-ups that don't get forgotten, synced with your Office 365 or Google calendar." },
      { name: "Reports", body: "Funded volume, conversion by source, team activity and commissions.", plan: "Growth" },
    ],
  },
  {
    title: "Communications",
    intro: "Every conversation, on the file.",
    items: [
      { name: "Email sync", body: "Office 365 and Google mail linked to the right contact automatically." },
      { name: "Business texting", body: "Two-way texts from your business number, saved to the file." },
      { name: "Message templates", body: "Saved replies for the questions you answer every day.", plan: "Growth" },
      { name: "Toll-free number", body: "A toll-free main line for your website and ads.", plan: "Growth" },
      { name: "Multiple business lines", body: "Separate numbers for teams, brands or regions.", plan: "Pro" },
    ],
  },
  {
    title: "Client portal and applications",
    intro: "Your brand in front of every borrower.",
    items: [
      { name: "6-step application wizard", body: "Business, owners, funding needs, financials, documents, sign. On the web and in the iPhone and Android app, shown with your branding." },
      { name: "Client mini-portal", body: "Borrowers check status, answer requests and upload what's missing without calling you." },
      { name: "Referrer portal", body: "Partners send you deals and see how they're going.", plan: "Growth" },
      { name: "Lender portal", body: "Lenders review the files you send them in one place.", plan: "Pro" },
    ],
  },
  {
    title: "Documents and lenders",
    intro: "From upload to submission.",
    items: [
      { name: "Document collection with OCR", body: "Statements and financials are read on upload and checked for missing pages." },
      { name: "Lender submissions", body: "Build a package once and send it to the lenders you choose. You bring your own lenders." },
      { name: "Storage", body: "Pooled storage per seat, with extra space available when you need it." },
    ],
  },
  {
    title: "Phones and mobile",
    intro: "Your office in your pocket.",
    items: [
      { name: "iPhone dialler", body: "Calls and texts from your business number with the file on screen." },
      { name: "Call recording and AI summaries", body: "Recorded calls with a short written summary saved to the deal.", plan: "Growth" },
      { name: "Voicemail transcription", body: "Read voicemails instead of listening to them.", plan: "Growth" },
      { name: "Apple Watch and iPad apps", body: "Take calls on your wrist; run the staff portal on an iPad.", plan: "Growth" },
    ],
  },
  {
    title: "AI assistant",
    intro: "Named by you, working for you.",
    items: [
      { name: "Website assistant", body: "Answers visitors' questions, checks if they're a fit and books the call." },
      { name: "Your products, your answers", body: "Teach it the products and lending criteria you work with so its answers match how you do business." },
    ],
  },
  {
    title: "Marketing and growth",
    intro: "Know what brings in funded deals.",
    items: [
      { name: "Website visitor tracking", body: "See which pages a lead read before they applied.", plan: "Growth" },
      { name: "Ad attribution", body: "Tie funded deals back to the ad that started them.", plan: "Pro" },
    ],
  },
  {
    title: "Admin and access",
    intro: "Control for owners.",
    items: [
      { name: "Your branding", body: "Your name, logo and colours across the portal, apps and emails." },
      { name: "Roles", body: "Admins manage the account and settings; staff work their deals." },
      { name: "Single sign-on", body: "Staff sign in with their Microsoft work account.", plan: "Pro" },
      { name: "API access", body: "Connect your own tools to your data.", plan: "Pro" },
    ],
  },
];

export default function Features() {
  usePageMeta(
    "Features",
    `Everything in ${PRODUCT_NAME}: pipeline and CRM, communications, branded client portal, documents with OCR, lender submissions, iPhone dialler and AI assistant.`,
    "/features",
  );
  return (
    <>
      <div className="wrap page-head">
        <h1>Features</h1>
        <p>
          Everything below is included on every plan unless it's marked Growth or Pro. <Link to="/pricing">See plans</Link>.
        </p>
      </div>
      <div className="wrap">
        {AREAS.map((a) => (
          <section className="feature-area" key={a.title} aria-labelledby={`area-${a.title}`}>
            <div>
              <h2 id={`area-${a.title}`} style={{ fontSize: "var(--step-2)" }}>
                {a.title}
              </h2>
              <p className="muted">{a.intro}</p>
            </div>
            <ul>
              {a.items.map((i) => (
                <li key={i.name}>
                  <strong>
                    {i.name}
                    {i.plan && (
                      <span className="small" style={{ fontWeight: 500, color: "var(--accent-ink)", marginLeft: "0.5rem" }}>
                        {i.plan === "Pro" ? "Pro" : "Growth and Pro"}
                      </span>
                    )}
                  </strong>
                  <span>{i.body}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
