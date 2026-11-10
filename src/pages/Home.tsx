import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { FeatureRequest } from "../components/FeatureRequest";
import { Arch } from "../components/Arch";
import { PgiTip } from "../components/PgiTip";
import { ScreenGallery } from "../components/ScreenGallery";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

// The competitor price data is only needed below the fold: it loads in its own file.
const StackCompare = lazy(() => import("../components/StackCompare").then((m) => ({ default: m.StackCompare })));

const PARTS = [
  {
    title: "Pipeline and CRM",
    body: "Every deal from first call to funded, with contacts, companies, notes, tasks and a full history of what happened.",
  },
  {
    title: "Branded client portal",
    body: "Your borrowers apply through a 6-step application under your name, upload documents and check progress themselves. As an app on iPhone or Android, or as a website in any browser: their choice.",
  },
  {
    title: "Documents with OCR",
    body: "Bank statements, financials and IDs are read on upload, so the numbers are in the file before you open it.",
  },
  {
    title: "Fraud checks on every file",
    body: "Edited statements, statement math that doesn't add up, reused documents and revenue that doesn't match deposits, flagged before a lender sees them.",
  },
  {
    title: "Lender submissions",
    body: "Match the deal to your own lenders, package the file once and send it. You bring your own lenders and your own terms.",
  },
  {
    title: "iPhone dialler and texting",
    body: "Call and text from your business number, with the client's file on screen. Minutes and texts come with every seat.",
  },
  {
    title: "Automations",
    body: "When a deal moves, a document is rejected or a call is missed, the follow-up text, email or task happens on its own.",
  },
  {
    title: "An assistant you name",
    body: "Give it your own name and voice. It answers website visitors' questions, checks if they're a fit and captures the lead.",
  },
];

const RULES = [
  "Your own server and database in Canada",
  "7-year record retention and legal holds",
  "Consent records and CASL texting rules",
  "Quiet hours in your time zone",
  "Call-recording notice before every recorded call",
  "SIN and SSN deleted once everyone has signed",
  "PIPEDA and Quebec Law 25 privacy requests",
  "Audit log of who did what, and when",
];

export default function Home() {
  usePageMeta(
    "",
    `${PRODUCT_NAME} is the complete system for commercial lending and business financing brokerages: CRM, branded client portal, iPhone dialler, documents with OCR, fraud checks, automations and an AI assistant. Hosted in Canada.`,
    "/",
  );
  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <h1>Run your lending brokerage on one system, not twelve</h1>
            <p className="lede">
              {PRODUCT_NAME} is a complete, ready-to-run system for commercial lending and business financing brokers.
              Pipeline, client portal, phones, documents, fraud checks and an AI assistant, all under your own brand, with
              the compliance rules built in.
            </p>
            <div className="hero__actions">
              <Link className="btn" to="/try">
                Try it yourself
              </Link>
              <Link className="btn btn--quiet" to="/why-keystone">
                Why brokers switch
              </Link>
            </div>
            <p className="small muted hero__note">
              Ten minutes, sample data, nothing to install. Or <Link to="/signup">start sign-up</Link>.
            </p>
          </div>
          <Arch />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="real-h">
        <div className="wrap">
          <h2 id="real-h">The real thing, not a mock-up</h2>
          <p className="section-intro">
            The actual apps on a sample file: your staff work the deal in the portal while your client applies and follows
            along from their phone. Select a screen to see it full size.
          </p>
          <ScreenGallery
            layout="pair"
            label="Screenshots of the staff portal and client app"
            items={[
              { name: "portal-pipeline", sizes: "(max-width: 700px) 92vw, 640px", caption: "Staff portal: the sales pipeline." },
              { name: "client-portal", sizes: "(max-width: 700px) 60vw, 220px", caption: "Client app: the borrower's own portal." },
            ]}
          />
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="switch-h">
        <div className="wrap">
          <h2 id="switch-h">Why switch: one system instead of a stack</h2>
          <p className="section-intro">
            To do what {PRODUCT_NAME} does, a general CRM needs marketing, calling, texting and more bought on top. Here's
            what a 5-person brokerage pays each vendor, from their own price pages.
          </p>
          <Suspense fallback={<div className="stack-compare" aria-busy="true" style={{ minHeight: "14rem" }} />}>
            <StackCompare limit={2} />
          </Suspense>
          <p className="actions" style={{ marginTop: "1.5rem" }}>
            <Link className="btn btn--quiet" to="/why-keystone">
              Why brokers switch
            </Link>
            <Link className="btn btn--ghost" to="/compare">
              Compare feature by feature
            </Link>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="parts-h">
        <div className="wrap">
          <h2 id="parts-h">What your team gets on day one</h2>
          <p className="section-intro">
            Your own branded version of the system, with its own private database, set up with your name, colours and logo. Your staff, your clients and your
            lenders only ever see your brand.
          </p>
          <div className="feature-grid">
            {PARTS.map((p) => (
              <div className="feature" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: "2rem" }}>
            <Link to="/features">See every feature by area</Link>
          </p>
        </div>
      </section>

      <section className="section band-dark" aria-labelledby="rules-h">
        <div className="wrap split">
          <div>
            <h2 id="rules-h">Compliance built in, not bolted on</h2>
            <p>
              The rules a Canadian lending brokerage works under are enforced by the system itself, so your team doesn't
              have to remember them.
            </p>
            <p>
              <Link className="btn btn--on-dark" to="/security">
                Security and compliance
              </Link>
            </p>
          </div>
          <ul className="tick-list tick-list--dark">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="pgi-h">
        <div className="wrap pgi">
          <div>
            <h2 id="pgi-h">Offer PGI on every deal</h2>
            <p className="lede">
              {/* KS_WEBSITE_PGI_REFERRAL_FEE_v1 - our insurance partner's terms: a flat referral fee per qualified referral,
                  paid whether or not a policy is bound, where permitted. Never "commission". */}
              Offer Personal Guarantee Insurance to your clients with one checkbox. Where permitted, your brokerage earns a
              flat referral fee for each qualified referral, whether or not the client buys a policy.
            </p>
            <PgiTip />
          </div>
          <div className="pgi__card">
            <p className="pgi__big">One checkbox</p>
            <p>
              Your client ticks the PGI box in their application. Our insurance partner handles the insurance
              conversation and the application, so you never give insurance advice.
            </p>
            <p className="small" style={{ marginBottom: 0 }}>
              Included on every plan. Not available in Quebec. Referral fees are paid where permitted, under your
              referral agreement.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="how-h">
        <div className="wrap split">
          <div>
            <h2 id="how-h">From sign-up to first call</h2>
            <p>
              Sign up online, pay securely, and your private copy is usually ready in about 15 minutes. Bring your contacts and deals
              from HubSpot, Salesforce, Pipedrive or a spreadsheet, with a dry run and undo. Your staff sign in to the
              dialler and iPad apps with their work email or mobile number; the app finds your brokerage automatically. Your clients can use your brokerage's own app on iPhone or Android,
              or your client portal as a website in any browser, whichever they prefer.
            </p>
            <p>
              <Link to="/pricing">Plans and prices</Link>
            </p>
          </div>
          <ol className="steps-list steps-list--compact">
            <li>Choose a plan and the number of seats.</li>
            <li>Pick your colours, logo, font and the assistant's name.</li>
            <li>Pay by bank debit or card through our secure checkout.</li>
            <li>We set up your copy and email your sign-in details.</li>
            <li>Import your data, add your lenders and invite your team.</li>
          </ol>
        </div>
      </section>
      <FeatureRequest />
    </>
  );
}
