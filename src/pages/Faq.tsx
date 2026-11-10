import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatMoney } from "../lib/pricing";

type QA = { q: string; a: ReactNode };

export default function Faq() {
  usePageMeta(
    "FAQ",
    `Answers to the questions brokers ask about ${PRODUCT_NAME}: switching and importing, data ownership, contracts, set-up time, training, support, lenders, phone numbers, pricing, trials and compliance.`,
    "/faq",
  );
  const { catalog: c } = useCatalog();
  const m = (n: number) => formatMoney(n, c.currency);
  const support = c.support_levels.map((s) => s.name).join(", ");

  // KS_WEBSITE_OVERHAUL - grouped by what a broker is deciding. Prices and allowances come from the catalogue.
  const groups: Array<{ id: string; title: string; items: QA[] }> = [
    {
      id: "basics",
      title: "The basics",
      items: [
        {
          q: `Who is ${PRODUCT_NAME} for?`,
          a: "Commercial lending and business financing brokerages. We're starting with brokerages in Canada, with the United States next.",
        },
        {
          q: "Why would we switch from our current CRM?",
          a: (
            <>
              Because a general CRM needs marketing, calling, texting, e-signing, document collection and fraud checks
              bought on top, and still doesn't build the loan file. {PRODUCT_NAME} does all of it in one system.{" "}
              <Link to="/why-keystone">Why brokers switch</Link>.
            </>
          ),
        },
        {
          q: "Can we try it before we buy?",
          a: (
            <>
              Yes. <Link to="/try">Try it yourself</Link> with sample data in about ten minutes, nothing to install. Once
              you're a customer on Starter or Growth, you can turn on a {c.trial.days}-day trial of every Pro feature from
              inside the app. When it ends you stay on your plan unless you choose to upgrade. Each brokerage gets one
              trial.
            </>
          ),
        },
        {
          q: "Do you provide lenders?",
          a: "No. You bring the lenders you already work with and add them to your system. Your relationships and terms stay yours.",
        },
        {
          q: "How do deals get to lenders? Is there a lender API?",
          a: (
            <>
              Lender matching ranks your lenders' products for each deal, and you send the package by email or as a secure
              download link, with a record of what went to whom. Lenders also have their own portal to keep their products
              up to date and send you deals. Sending deals straight into a lender's own system by API is coming soon; see
              the <Link to="/roadmap">roadmap</Link>.
            </>
          ),
        },
      ],
    },
    {
      id: "switching",
      title: "Switching and set-up",
      items: [
        {
          q: "How do we move our data over?",
          a: (
            <>
              An Admin imports contacts, companies, lenders, lender products, deals, notes and documents from a HubSpot,
              Salesforce or Pipedrive export, or a spreadsheet. You match the columns, preview the rows and run a dry run
              before anything is saved, and you can undo a whole import.{" "}
              <Link to="/help/import-from-hubspot-salesforce-pipedrive">How importing works</Link>.
            </>
          ),
        },
        {
          q: "How long does set-up take?",
          a: "Your private copy, with its own database, is usually ready about 15 minutes after payment, and we email your sign-in details the moment it is. Growth and Pro include onboarding help to get your team, lenders and branding in place. You can keep your old system running until you're ready.",
        },
        {
          q: "Can we keep our phone numbers?",
          a: "Every copy gets a local business number set up for it (and a toll-free number on Growth and Pro). Moving a number you already have isn't self-serve yet: talk to us before you switch and we'll go through it with you.",
        },
        {
          q: "How do my staff sign in to the apps?",
          a: "Your staff sign in to the dialler and iPad apps with their work email or mobile number; the app finds your brokerage automatically. Your clients use your brokerage's own app on iPhone or Android, or your client portal as a website in any browser.",
        },
        {
          q: "Is the client app under our name?",
          a: "Yes. Your clients can download your brokerage's own app from the App Store and Google Play, with your name, icon, colours and wording, or use the same client portal as a website in any browser. It's their choice. The app is published from your own Apple and Google developer accounts and is already connected to your system, so clients just sign in with a one-time code sent to their phone.",
        },
        {
          q: "Is there training?",
          a: (
            <>
              Every brokerage gets the help articles and Maya, the assistant that answers from them. Growth and Pro
              include onboarding help. The Premium support level adds a quarterly training call, and Dedicated adds
              new-staff training. <Link to="/pricing">Support levels</Link>.
            </>
          ),
        },
      ],
    },
    {
      id: "pricing",
      title: "Pricing and contracts",
      items: [
        {
          q: "What is a seat?",
          a: "A seat is one person on your team who signs in to the staff portal or apps. Your clients, referrers and lenders don't need seats.",
        },
        {
          q: "Are call minutes and texts per person?",
          a: "No. Each seat adds to an allowance that's shared by the whole team, so it doesn't matter who uses it.",
        },
        {
          q: "What happens if we go over an allowance?",
          a: `Nothing stops. Extra call minutes are ${m(c.overage.minute)} each and extra texts ${m(c.overage.text)} each, added to your next bill. Extra storage is ${m(c.extra_storage.price)} a month per ${c.extra_storage.block_gb} GB.`,
        },
        {
          q: "What support is included?",
          a: (
            <>
              Email support is included on every plan. The support levels are {support}; the paid ones add faster
              replies and live help. <Link to="/pricing">Prices and what each includes</Link>.
            </>
          ),
        },
        {
          q: "Is there a contract? Can we cancel?",
          a: "You choose monthly or yearly billing when you sign up; yearly billing is charged once a year at the lower seat price. To cancel, send a request from Get help in your portal. Your data is kept for 180 days so you can download it, with warning emails before it's deleted.",
        },
        {
          q: "Can we change plans later?",
          a: (
            <>
              Yes. Ask for an upgrade from inside the app or <Link to="/contact">contact us</Link>. Adding seats is the
              same. Features a lower plan doesn't include are locked, not deleted.
            </>
          ),
        },
        {
          q: "How do we pay?",
          a: "By pre-authorized debit from a Canadian business bank account (the default), or by credit card, through Stripe's secure checkout. Annual billing is charged once a year; monthly billing every month. Onboarding fees are charged once with your first payment.",
        },
      ],
    },
    {
      id: "data",
      title: "Data, security and compliance",
      items: [
        {
          q: "Who owns our data?",
          a: "You do. It's in your own database, and an Admin can download everything, every record and uploaded file, as one zip file at any time, including after you cancel.",
        },
        {
          q: "Where is our data stored?",
          a: (
            <>
              In Canada, in Microsoft Azure's Canada Central region, in a database just for your brokerage.{" "}
              <Link to="/security">More on security</Link>.
            </>
          ),
        },
        {
          q: "How long are records kept?",
          a: (
            <>
              Applications, uploaded documents, signed agreements, lender packages and the audit log are kept for 7 years after
              a file closes (funded, declined or withdrawn) and cannot be deleted before then. An admin can also place a legal
              hold, which keeps everything under it until the hold is released. <Link to="/security">More on records</Link>.
            </>
          ),
        },
        {
          q: "Does it handle CASL, quiet hours and US texting rules?",
          a: (
            <>
              Yes. Marketing texts only go to people with valid consent, STOP replies opt people out straight away, and
              automated messages wait for quiet hours in your time zone. Texts to US mobiles go from a registered toll-free
              or 10DLC line. <Link to="/security">Texting and calling rules</Link>.
            </>
          ),
        },
        {
          q: "What about PIPEDA and Quebec's Law 25?",
          a: (
            <>
              Consent is recorded for each contact, privacy requests (access, correction, deletion) are tracked with a
              30-day due date, and the client app waits for consent before loading Google tags in Quebec. Your brokerage
              stays responsible for how it uses client information. <Link to="/security">Privacy and consent</Link>.
            </>
          ),
        },
      ],
    },
  ];

  return (
    <>
      <div className="wrap wrap--narrow page-head">
        <h1>Questions and answers</h1>
        <nav aria-label="Question groups" className="chips">
          {groups.map((g) => (
            <a key={g.id} className="chip" href={`#faq-${g.id}`}>
              {g.title}
            </a>
          ))}
        </nav>
      </div>
      <div className="wrap wrap--narrow faq">
        {groups.map((g) => (
          <section key={g.id} id={`faq-${g.id}`} aria-labelledby={`faq-${g.id}-h`} className="faq__group">
            <h2 id={`faq-${g.id}-h`}>{g.title}</h2>
            {g.items.map((i) => (
              <details key={i.q}>
                <summary>{i.q}</summary>
                <p>{i.a}</p>
              </details>
            ))}
          </section>
        ))}
        <p style={{ marginTop: "2rem" }}>
          Still have a question? Ask Maya (bottom right), or <Link to="/contact">contact us</Link>.
        </p>
      </div>
    </>
  );
}
