import { Link } from "react-router-dom";
import { FeatureRequest } from "../components/FeatureRequest";
import { PgiTip } from "../components/PgiTip";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { Screenshot } from "../components/Screenshot";
import type { ScreenName } from "../lib/screens";

type Item = { name: string; body: string; plan?: "Growth" | "Pro"; pgiTip?: boolean };
type Area = { title: string; intro: string; items: Item[] };

const AREAS: Area[] = [
  {
    title: "Pipeline and CRM",
    intro: "Where your deals live.",
    items: [
      { name: "Pipeline", body: "Drag deals through your stages, see what's stuck and who owns it." },
      { name: "Contacts and companies", body: "Borrowers, referrers and lenders with every call, text, email and document in one timeline." },
      { name: "Tasks and calendar", body: "Follow-ups that don't get forgotten, synced with your Microsoft 365 or Google calendar." },
      { name: "Reports", body: "Funded volume, conversion by source, team activity and commissions.", plan: "Growth" },
    ],
  },
  {
    title: "Communications",
    intro: "Every conversation, on the file.",
    items: [
      { name: "Email sync", body: "Outlook (Microsoft 365) inbox sync: mail is linked to the right contact automatically. Gmail can send for now; reading a Gmail inbox comes later." },
      { name: "Business texting", body: "Two-way texts from your business number, saved to the file." },
      { name: "Message templates and snippets", body: "Saved replies for the questions you answer every day, and #shortcuts you drop into any message.", plan: "Growth" },
      { name: "Automations", body: "Workflows that send messages, create tasks and move deals when something happens.", plan: "Growth" },
      { name: "Business phone number", body: "A local business line, set up for you when your system is created." },
      { name: "Toll-free number", body: "A toll-free main line for your website and ads, set up for you.", plan: "Growth" },
      { name: "Multiple business lines and direct lines", body: "Separate numbers for teams, brands or regions, and a direct line for each person, picked and set up in a click.", plan: "Pro" },
    ],
  },
  {
    title: "Client portal and applications",
    intro: "Your brand in front of every borrower.",
    items: [
      { name: "6-step application wizard", body: "Business, owners, funding needs, financials, documents, sign, shown with your branding. Clients can use it as an app on iPhone or Android, or as a website in any browser: their choice." },
      { name: "Client mini-portal", body: "Borrowers check status, answer requests and upload what's missing without calling you." },
      { name: "Referrer portal", body: "Partners send you deals and see how they're going.", plan: "Growth" },
      { name: "Broker portal", body: "Partner brokers sign your broker agreement, upload client files and agree the commission split.", plan: "Growth" },
      { name: "Lender portal", body: "Lenders keep their details and products current, and send you deals they can't place themselves. The lender package goes to each lender by email or API." },
      {
        name: "Personal Guarantee Insurance (PGI)",
        body: `Offer PGI to your clients to close more deals and earn extra commission. All you need to do is... nothing. One checkbox, and ${PRODUCT_NAME} pays you.`,
        pgiTip: true,
      },
    ],
  },
  {
    title: "Documents and lenders",
    intro: "From upload to submission.",
    items: [
      { name: "Document collection with OCR", body: "Statements and financials are read on upload and checked for missing pages." },
      { name: "Lender submissions", body: "Build a package once and send it to each lender you choose by email or API. You bring your own lenders." },
      { name: "Storage", body: "Pooled storage per seat, with extra space available when you need it." },
    ],
  },
  {
    title: "Phones and mobile",
    intro: "Your office in your pocket.",
    items: [
      { name: "iPhone dialler", body: "Calls and texts from your business number with the file on screen." },
      { name: "Call recording", body: "Every call is recorded, on every plan." },
      { name: "Call playback and AI summaries", body: "Play recorded calls back and get a short written summary saved to the deal.", plan: "Growth" },
      { name: "Voicemail transcription", body: "Read voicemails instead of listening to them.", plan: "Growth" },
      { name: "iPad app", body: "Run the full staff portal on an iPad." },
      { name: "Apple Watch app", body: "Take and place calls on your wrist.", plan: "Growth" },
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

const GALLERY: Array<{ name: ScreenName; caption: string }> = [
  { name: "portal-documents", caption: "Documents read on upload, with tampered statements flagged." },
  { name: "portal-financials", caption: "Figures from the financial statements, ready to review." },
  { name: "portal-banking", caption: "Bank statement analysis with a three-month trend." },
  { name: "portal-credit", caption: "A credit summary drafted for you to edit." },
  { name: "portal-fraud", caption: "A fraud score with plain-English reasons." },
  { name: "portal-lenders", caption: "Lenders matched to the deal, ready to submit." },
  { name: "portal-calculator", caption: "A loan calculator with the full payment schedule." },
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
      <section className="section section--tight" aria-labelledby="inside-h">
        <div className="wrap">
        <h2 id="inside-h" style={{ fontSize: "var(--step-2)" }}>
          A look inside
        </h2>
        <p className="muted">Real screens from the staff portal, on a sample application.</p>
        <div className="shots-grid">
          {GALLERY.map((g) => (
            <Screenshot key={g.name} name={g.name} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 520px" caption={g.caption} />
          ))}
        </div>
        </div>
      </section>
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
                  {i.pgiTip && (
                    <span className="feature-tip">
                      <PgiTip />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <FeatureRequest />
    </>
  );
}
