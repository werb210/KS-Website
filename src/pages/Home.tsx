import { Link } from "react-router-dom";
import { FeatureRequest } from "../components/FeatureRequest";
import { Arch } from "../components/Arch";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

const PARTS = [
  {
    title: "Pipeline and CRM",
    body: "Every deal from first call to funded, with contacts, companies, notes, tasks and a full history of what happened.",
  },
  {
    title: "Branded client portal",
    body: "Your borrowers apply through a 6-step application under your name, upload documents and check progress themselves.",
  },
  {
    title: "Documents with OCR",
    body: "Bank statements, financials and IDs are read on upload, so the numbers are in the file before you open it.",
  },
  {
    title: "Lender submissions",
    body: "Package a file once and send it to the lenders you work with. You bring your own lenders and your own terms.",
  },
  {
    title: "iPhone dialler",
    body: "Call and text from your business number, with the client's file on screen. Apple Watch app on Growth and Pro.",
  },
  {
    title: "An assistant you name",
    body: "Give it your own name and voice. It answers website visitors' questions, checks if they're a fit and captures the lead.",
  },
];

export default function Home() {
  usePageMeta(
    "",
    `${PRODUCT_NAME} is the complete system for commercial lending and business financing brokerages: CRM, branded client portal, iPhone dialler, documents with OCR and an AI assistant. Hosted in Canada.`,
    "/",
  );
  return (
    <>
      <section className="hero">
        <div className="wrap hero__grid">
          <div>
            <h1>Run your lending brokerage on one system, not twelve</h1>
            <p className="lede">
              {PRODUCT_NAME} is a complete, ready-to-run system for commercial lending and business financing brokers. Pipeline,
              client portal, phones, documents and an AI assistant, all under your own brand.
            </p>
            <p className="muted">
              It isn't a prototype: it's the system a working Canadian brokerage runs on every day, now available to yours.
            </p>
            <div className="hero__actions">
              <Link className="btn" to="/signup">
                Start sign-up
              </Link>
              <Link className="btn btn--quiet" to="/pricing">
                See pricing
              </Link>
            </div>
          </div>
          <Arch />
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="parts-h">
        <div className="wrap">
          <h2 id="parts-h">What your team gets on day one</h2>
          <p className="lede" style={{ marginBottom: "2.5rem" }}>
            Your own copy of the system, set up with your name, colours and logo. Your staff, your clients and your
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
          <p style={{ marginTop: "2.5rem" }}>
            <Link to="/features">See every feature by area</Link>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="how-h">
        <div className="wrap split">
          <div>
            <h2 id="how-h">From sign-up to first call</h2>
            <p>
              Sign up online, pay securely, and we set up your copy within one business day. You get sign-in details by
              email, your staff install the apps, and they sign in with your company code.
            </p>
          </div>
          <ol className="plain-list" style={{ paddingLeft: "1.4rem", listStyle: "decimal" }}>
            <li>Choose a plan and the number of seats.</li>
            <li>Pick your company code, colours, logo and the assistant's name.</li>
            <li>Pay by card through our secure checkout.</li>
            <li>We set up your copy and email your sign-in details.</li>
            <li>Add your lenders, invite your team and start taking applications.</li>
          </ol>
        </div>
      </section>

      <section className="section section--surface">
        <div className="wrap split">
          <div>
            <h2>Hosted in Canada</h2>
            <p>
              Your data is stored in Microsoft Azure's Canada Central region, in a database that belongs to your
              brokerage alone. <Link to="/security">How we look after your data</Link>.
            </p>
          </div>
          <div>
            <h2>Priced per seat</h2>
            <p>
              Starter, Growth and Pro, with call minutes and texts pooled across your team. Try every Pro feature free
              for 14 days on Starter. <Link to="/pricing">Compare plans</Link>.
            </p>
          </div>
        </div>
      </section>
      <FeatureRequest />
    </>
  );
}
