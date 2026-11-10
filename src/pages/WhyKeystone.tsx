// KS_WEBSITE_OVERHAUL - /why-keystone: the answer to "why would I switch?". The cost of a general CRM plus the products
// around it (src/data/compare.ts, the same figures as /compare) next to Keystone (the live catalogue), what each job
// moves into, how switching works and straight answers to the usual objections. Only what the system does today;
// anything not built is said to be coming soon.
import { Link } from "react-router-dom";
import { StackCompare } from "../components/StackCompare";
import { PRODUCT_NAME } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { usePageMeta } from "../hooks/usePageMeta";

const JOBS: Array<{ job: string; elsewhere: string; here: string }> = [
  {
    job: "Loan application and client portal",
    elsewhere: "General web forms, plus a customer-portal licence",
    here: "A 6-step application and client portal under your brand, as an app or in any browser",
  },
  {
    job: "Documents",
    elsewhere: "Email attachments or a file-sharing tool",
    here: "A checklist per lender product; statements and financials read on upload, missing months flagged",
  },
  {
    job: "Fraud checks",
    elsewhere: "Manual review, or a separate service",
    here: "Tampered files, statement math, reused documents and revenue vs deposits checked on every plan",
  },
  {
    job: "Lenders",
    elsewhere: "Spreadsheets and emails",
    here: "Lender matching on your own lenders, packages sent in one step, a lender portal",
  },
  {
    job: "Calling and texting",
    elsewhere: "A dialler app and an SMS add-on, each billed separately",
    here: "Your business number, an iPhone dialler and texting, with minutes and texts in the seat price",
  },
  {
    job: "Marketing",
    elsewhere: "A marketing product priced by contacts",
    here: "Campaigns and sequences on every plan; the Marketing add-on for volume and advanced tools",
  },
  {
    job: "E-signing",
    elsewhere: "A separate e-signature subscription",
    here: "Applications, fee agreements and term sheets signed in the client app",
  },
  {
    job: "Compliance records",
    elsewhere: "Your own policies, spread across each tool",
    here: "7-year retention, legal holds, consent records, texting rules and an audit log, in one place in Canada",
  },
];

const STEPS: Array<[string, string]> = [
  ["Sign up online", "Pick a plan and seats, add your logo and colours, and pay by bank debit or card. Your private copy is usually ready in about 15 minutes."],
  ["Bring your data", "Import contacts, companies, lenders, deals, notes and documents from HubSpot, Salesforce, Pipedrive or a spreadsheet. Preview it, run a dry run, then import, and undo the whole import if it isn't right."],
  ["Add your lenders and team", "Add the lenders you already work with. Your staff sign in to the portal, the iPhone dialler and the iPad app with their work email or mobile number."],
  ["Go live", "Send clients your application link. Keep your old system running until you're ready to switch it off."],
];

export default function WhyKeystone() {
  usePageMeta(
    `Why brokers switch to ${PRODUCT_NAME}`,
    `Why commercial lending brokers switch to ${PRODUCT_NAME}: one system instead of a general CRM plus marketing, calling, e-signing, document and fraud tools. The cost side by side, with sources.`,
    "/why-keystone",
  );
  const { catalog } = useCatalog();
  const trialDays = catalog.trial.days;
  return (
    <>
      <div className="wrap page-head">
        <h1>One system, instead of a CRM and five add-ons</h1>
        <p className="lede">
          Most brokerages run a general CRM, then pay again for marketing, calling and texting, e-signing, document
          collection and fraud checks, and still work their loan files in spreadsheets. {PRODUCT_NAME} is built for
          commercial lending, so the lending work is already there.
        </p>
        <div className="actions">
          <Link className="btn" to="/try">
            Try it yourself
          </Link>
          <Link className="btn btn--quiet" to="/pricing">
            See pricing
          </Link>
        </div>
      </div>

      <section className="section section--tight" aria-labelledby="cost-h">
        <div className="wrap">
          <h2 id="cost-h">What it costs to match {PRODUCT_NAME}</h2>
          <p className="section-intro">
            A 5-person brokerage, with marketing. Each block is a product you'd buy and manage.
          </p>
          <StackCompare />
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="jobs-h">
        <div className="wrap">
          <h2 id="jobs-h">What moves into one place</h2>
          <div className="jobs" role="table" aria-label="Each job: with a general CRM, and in Keystone">
            <div className="jobs__head" role="row">
              <span role="columnheader">The job</span>
              <span role="columnheader">With a general CRM</span>
              <span role="columnheader">In {PRODUCT_NAME}</span>
            </div>
            {JOBS.map((j) => (
              <div className="jobs__row" role="row" key={j.job}>
                <span role="rowheader" className="jobs__job">
                  {j.job}
                </span>
                <span role="cell" className="jobs__else">
                  <span className="jobs__label">With a general CRM: </span>
                  {j.elsewhere}
                </span>
                <span role="cell" className="jobs__here">
                  <span className="jobs__label">In {PRODUCT_NAME}: </span>
                  {j.here}
                </span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: "1rem" }}>
            Where general CRMs are strong: large app marketplaces, and a lower price per seat for a pipeline on its own.{" "}
            <Link to="/compare">See the full comparison</Link>.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="switch-h">
        <div className="wrap split">
          <div>
            <h2 id="switch-h">How switching works</h2>
            <p>
              Your old system keeps running until you're ready. Growth and Pro include onboarding help to get your team,
              lenders and branding in place.
            </p>
            <p className="small muted">
              Phone numbers: {PRODUCT_NAME} sets up a local business number for you, and a toll-free number on Growth and
              Pro. To keep a number you already have, talk to us before you switch.
            </p>
          </div>
          <ol className="steps-list">
            {STEPS.map(([t, d]) => (
              <li key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="answers-h">
        <div className="wrap wrap--narrow faq">
          <h2 id="answers-h">Straight answers</h2>
          <details>
            <summary>We already pay for a CRM.</summary>
            <p>
              Add up what sits around it: marketing email, a dialler, an SMS add-on, e-signing and document collection are
              usually separate bills. {PRODUCT_NAME}'s seat price includes call minutes and texts, and the lending tools
              are built in.
            </p>
          </details>
          <details>
            <summary>It costs more per seat than our CRM.</summary>
            <p>
              For a pipeline alone, a general CRM can cost less per seat. Compare what you'd have to buy to do the same
              work: the table above, line by line on the <Link to="/compare">compare page</Link>, with each vendor's own
              published prices.
            </p>
          </details>
          <details>
            <summary>Moving our data is risky.</summary>
            <p>
              Imports show a preview and run a dry run first, and a whole import can be undone. Your data is yours: an
              Admin can download everything as one zip file at any time, even after cancelling.
            </p>
          </details>
          <details>
            <summary>Will my team actually use it?</summary>
            <p>
              It's built around the work brokers already do: the file, the documents, the lenders and the calls, in one
              place, on the computer, iPhone and iPad. Every brokerage gets the help articles and Maya; Premium and
              Dedicated support add training.
            </p>
          </details>
          <details>
            <summary>Can we try it first?</summary>
            <p>
              Yes. <Link to="/try">Try it yourself</Link> with sample data in about ten minutes. Customers on Starter or
              Growth can also turn on a {trialDays}-day trial of every Pro feature from inside the app.
            </p>
          </details>
          <details>
            <summary>What isn't built yet?</summary>
            <p>
              We say so plainly. The <Link to="/roadmap">roadmap</Link> shows what's planned and being built, and{" "}
              <Link to="/help/coming-soon">Coming soon</Link> lists what isn't available yet, like Android apps for staff
              and sending deals into a lender's own system by API.
            </p>
          </details>
        </div>
      </section>

      <section className="section cta-band" aria-labelledby="why-cta-h">
        <div className="wrap split split--center">
          <h2 id="why-cta-h">See your own deal in {PRODUCT_NAME}</h2>
          <div className="actions">
            <Link className="btn btn--on-dark" to="/try">
              Try it yourself
            </Link>
            <Link className="btn btn--quiet-on-dark" to="/signup">
              Start sign-up
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
