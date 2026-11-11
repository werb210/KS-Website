import { Link } from "react-router-dom";
import { FeatureRequest } from "../components/FeatureRequest";
import { PgiTip } from "../components/PgiTip";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { ScreenGallery, type GalleryItem } from "../components/ScreenGallery";

type Item = { name: string; body: string; plan?: "Growth" | "Pro"; pgiTip?: boolean };
type Area = { id: string; title: string; intro: string; items: Item[] };

// Plan labels follow the catalogue (src/lib/plans.ts, KS-Ops src/pricing.ts). Only what the system does today.
const AREAS: Area[] = [
  {
    id: "crm",
    title: "Pipeline and CRM",
    intro: "Where your deals live.",
    items: [
      { name: "Pipeline", body: "Drag deals through lending stages, see what's stuck and who owns it, and the next action on every file." },
      { name: "Contacts and companies", body: "Borrowers, referrers and lenders with every call, text, email, meeting, note and document in one timeline." },
      { name: "Custom fields, tags and saved segments", body: "Track what your brokerage needs, filter on it and save the lists you use." },
      { name: "Duplicates and clean-up", body: "Find and merge duplicate contacts and companies, and fix messy data in a batch you can undo." },
      { name: "Teams and record visibility", body: "Sales teams, and who sees all records, their team's or only their own.", plan: "Growth" },
      { name: "Reports and dashboards", body: "Funded volume, conversion by source, lender scorecards, speed to lead, commissions and team activity.", plan: "Growth" },
      { name: "Revenue forecast", body: "Commission forecast per person and team by month or quarter: weighted pipeline, commit and best case, next to each person's goals.", plan: "Growth" },
    ],
  },
  {
    id: "automations",
    title: "Automations and tasks",
    intro: "The follow-up happens without anyone remembering it.",
    items: [
      { name: "Automations", body: "When a deal changes stage, a document is rejected, a client messages, a call is missed, a contact is added or a client books, send a text or email, create a task, set the owner, tag, note or notify, wait, or branch. Describe one in a sentence and the assistant drafts it.", plan: "Growth" },
      { name: "Sequences", body: "Drip emails and texts that stop when the contact replies and wait for quiet hours in your time zone." },
      { name: "Tasks and task queues", body: "Due dates, priorities and reminders, synced with Microsoft To Do or Google Tasks, and shared queues your team works through one by one." },
      { name: "Lead rotation", body: "New website and booking leads get an owner in turn, skipping people who are away." },
      { name: "Built-in follow-ups", body: "Applicants who stop part-way get a reminder and you get a task. Each call, email or meeting can suggest the follow-up task." },
      { name: "Post-funding survey and review requests", body: "When a deal funds, a short survey goes out and happy clients are asked for a Google review.", plan: "Growth" },
    ],
  },
  {
    id: "client",
    title: "Client portal and applications",
    intro: "Your brand in front of every borrower.",
    items: [
      { name: "6-step application wizard", body: "Business, owners, funding needs, financials, documents, sign, shown with your branding. Clients can use it as an app on iPhone or Android, or as a website in any browser: their choice." },
      { name: "Client mini-portal", body: "Borrowers check status, answer requests, upload what's missing, sign and message you without calling." },
      { name: "Booking pages", body: "A booking link for each person and a team page, with reminders, that lands on the contact's timeline." },
      { name: "Lender portal", body: "Lenders keep their details and products current, and send you deals they can't place themselves." },
      { name: "ID and selfie verification", body: "Applicants and guarantors verify with a photo of their government ID and a selfie in the client app. Canada and the US. Some checks are included each month.", plan: "Growth" },
      { name: "Referrer portal", body: "Partners send you deals and see how they're going.", plan: "Growth" },
      { name: "Broker portal", body: "Partner brokers sign your broker agreement, upload client files and agree the commission split.", plan: "Growth" },
      {
        name: "Personal Guarantee Insurance (PGI)",
        // KS_WEBSITE_PGI_REFERRAL_FEE_v1
        body: "Offer Personal Guarantee Insurance to your clients with one checkbox. Where permitted, your brokerage earns a flat referral fee for each qualified referral, whether or not the client buys a policy. Our insurance partner handles the rest.",
        pgiTip: true,
      },
    ],
  },
  {
    id: "documents",
    title: "Documents, underwriting and lenders",
    intro: "From upload to submission.",
    items: [
      { name: "Document collection with OCR", body: "A checklist per lender product. Statements and financials are read on upload, sorted, and checked for missing months." },
      { name: "Banking analysis, financials and credit summary", body: "Deposits, balances and NSFs over three months, figures from financial statements, and a credit summary drafted for you to edit." },
      { name: "Fraud checks", body: "Tampered files, statement math, reused documents and revenue vs deposits on every plan; more checks on Growth and Pro." },
      { name: "Lender matching and packages", body: "Rank your own lenders' products for the deal, then build the package once and send it by email or as a secure download link." },
      { name: "E-signing", body: "Applications, fee agreements and term sheets signed in the client app." },
      // KS_WEBSITE_OFFERS_NOT_QUOTES - quotes were removed; offers and term sheets replace them.
      { name: "Offers and term sheets", body: "Upload each lender's term sheet, or issue your own when you buy the deal and sell it on, with no lender name. Set your rate, fees and fee from the proceeds on each offer and see what it earns you. Clients compare offers side by side and sign in the client app." },
      // KS_WEBSITE_LENDER_API
      { name: "Lender API connections", body: "Connect a lender's broker API with your own broker key: submit the package by API and get the lender's status, offers, conditions and document requests back on the file automatically. Email stays the fallback. Growth and Pro." },
      { name: "Storage", body: "Pooled storage per seat, with extra space available when you need it." },
    ],
  },
  {
    id: "phones",
    title: "Phones and messaging",
    intro: "Your office in your pocket.",
    items: [
      { name: "Business phone number", body: "A local business line, set up for you when your system is created, with a phone menu you edit yourself." },
      { name: "iPhone dialler", body: "Calls and texts from your business number with the caller's file on screen." },
      { name: "Business texting", body: "Two-way texts from your business number, saved to the file, with STOP and consent handled for you." },
      { name: "Email sync", body: "Outlook (Microsoft 365) inbox sync: mail is linked to the right contact automatically. Gmail can send for now; reading a Gmail inbox comes later." },
      { name: "Team chat", body: "Channels, direct messages and threads for your staff, in the portal and on iPhone." },
      { name: "Call recording", body: "Calls are recorded on every plan, with a notice to the caller first." },
      { name: "Call playback and AI summaries", body: "Play recorded calls back and get a short written summary saved to the deal.", plan: "Growth" },
      { name: "Voicemail transcription", body: "Read voicemails instead of listening to them.", plan: "Growth" },
      { name: "Message templates and snippets", body: "Saved replies for the questions you answer every day, and #shortcuts you drop into any message.", plan: "Growth" },
      { name: "Toll-free number", body: "A toll-free main line for your website and ads, set up for you.", plan: "Growth" },
      { name: "Apple Watch app", body: "Take and place calls on your wrist.", plan: "Growth" },
      { name: "Multiple business lines and direct lines", body: "Separate numbers for teams, brands or regions, and a direct line for each person, picked and set up in a click.", plan: "Pro" },
    ],
  },
  {
    id: "ai",
    title: "AI assistant",
    intro: "Named by you, working for you.",
    items: [
      { name: "Website assistant", body: "Answers visitors' questions, checks if they're a fit and books the call." },
      { name: "For your clients and staff", body: "Clients ask about their file and what's next; staff ask about the pipeline, draft emails and get banking and credit summaries." },
      { name: "Your products, your answers", body: "Teach it the products and lending criteria you work with so its answers match how you do business." },
    ],
  },
  {
    id: "marketing",
    title: "Marketing and growth",
    intro: "Know what brings in funded deals.",
    items: [
      { name: "Email and text campaigns", body: "Campaigns to a saved segment, with unsubscribes and texting consent checked for you." },
      { name: "Website visitor tracking", body: "See which pages a lead read before they applied.", plan: "Growth" },
      { name: "Ad attribution", body: "Tie funded deals back to the ad that started them.", plan: "Pro" },
    ],
  },
  {
    id: "admin",
    title: "Admin, security and integrations",
    intro: "Control for owners.",
    items: [
      { name: "Your branding", body: "Your name, logo, colours and font across the portal, apps, emails and documents." },
      { name: "Roles and sign-in security", body: "Admin, Staff, Marketing and Ops roles; codes, passkeys and Face ID; Admins can require two-step sign-in." },
      { name: "Retention, legal holds and audit log", body: "Records locked for 7 years, holds that stop deletes, and a log of who did what. See security and compliance." },
      { name: "Import and export", body: "Bring data from HubSpot, Salesforce, Pipedrive or a spreadsheet with a dry run and undo; download everything as one zip." },
      { name: "Microsoft 365, Google and QuickBooks", body: "Mail, calendar, tasks and files from Microsoft 365 or Google; fee invoices created in QuickBooks Online." },
      { name: "Single sign-on", body: "Staff sign in with their Microsoft or Google work account.", plan: "Pro" },
      { name: "API access", body: "Connect your own tools to your data with API keys.", plan: "Pro" },
      { name: "Webhooks and Zapier", body: "Send changes to your other systems as they happen.", plan: "Pro" },
      { name: "Custom roles and permissions", body: "Build your own roles: choose what each can view, create, edit, delete and export, and whether it sees all records, its team's or only its own.", plan: "Pro" },
    ],
  },
];

const THUMB_SIZES = "(max-width: 599px) 92vw, (max-width: 1023px) 46vw, 340px";

const GALLERY: GalleryItem[] = [
  { name: "portal-documents", caption: "Documents read on upload, with tampered statements flagged." },
  { name: "portal-financials", caption: "Figures from the financial statements, ready to review." },
  { name: "portal-banking", caption: "Bank statement analysis with a three-month trend." },
  { name: "portal-credit", caption: "A credit summary drafted for you to edit." },
  { name: "portal-fraud", caption: "A fraud score with plain-English reasons." },
  { name: "portal-lenders", caption: "Lenders matched to the deal, ready to submit." },
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
        <p className="lede">
          Everything below is included on every plan unless it's marked Growth or Pro. <Link to="/pricing">See plans</Link>.
        </p>
        <nav aria-label="Feature areas" className="chips">
          {AREAS.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="chip">
              {a.title}
            </a>
          ))}
          <Link to="/fraud-protection" className="chip">
            Fraud protection
          </Link>
          <Link to="/security" className="chip">
            Security and compliance
          </Link>
        </nav>
      </div>
      <section className="section section--tight" aria-labelledby="inside-h">
        <div className="wrap">
          <h2 id="inside-h">A look inside</h2>
          <p className="section-intro">Real screens from the staff portal, on a sample application. Select one to see it full size.</p>
          <ScreenGallery label="Staff portal screenshots" items={GALLERY.map((g) => ({ ...g, sizes: THUMB_SIZES }))} />
        </div>
      </section>
      <div className="wrap">
        {AREAS.map((a) => (
          <section className="feature-area" key={a.id} id={a.id} aria-labelledby={`area-${a.id}`}>
            <div className="feature-area__head">
              <h2 id={`area-${a.id}`}>{a.title}</h2>
              <p className="muted">{a.intro}</p>
            </div>
            <ul>
              {a.items.map((i) => (
                <li key={i.name}>
                  <strong>
                    {i.name}
                    {i.plan && <span className="plan-tag">{i.plan === "Pro" ? "Pro" : "Growth and Pro"}</span>}
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
