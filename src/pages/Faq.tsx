import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { useCatalog } from "../hooks/useCatalog";
import { usePageMeta } from "../hooks/usePageMeta";
import { formatMoney } from "../lib/pricing";

export default function Faq() {
  usePageMeta("FAQ", `Answers to common questions about ${PRODUCT_NAME}: seats, trials, lenders, data, set-up and billing.`, "/faq");
  const { catalog: c } = useCatalog();
  const m = (n: number) => formatMoney(n, c.currency);
  const items: { q: string; a: ReactNode }[] = [
    {
      q: `Who is ${PRODUCT_NAME} for?`,
      a: "Commercial lending and business financing brokerages. We're starting with brokerages in Canada, with the United States next.",
    },
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
      q: "How does the free trial work?",
      a: `On Starter you can turn on a ${c.trial.days}-day trial of every Pro feature from inside the app. When it ends you stay on Starter unless you choose to upgrade. Each brokerage gets one trial.`,
    },
    {
      q: "Do you provide lenders?",
      a: "No. You bring the lenders you already work with and add them to your system. Your relationships and terms stay yours.",
    },
    {
      q: "How long does set-up take?",
      a: "We set up your copy within one business day of payment and email your sign-in details. Growth and Pro include onboarding help to get your team, lenders and branding in place.",
    },
    {
      q: "What's a company code?",
      a: "A short name you choose at sign-up, like prairie-capital. Your staff enter it once in the iPhone dialler and iPad apps so those apps connect to your brokerage. Your clients never need it: they use your brokerage's own app on iPhone or Android, or your client portal as a website in any browser.",
    },
    {
      q: "Is the client app under our name?",
      a: "Yes. Your clients can download your brokerage's own app from the App Store and Google Play, with your name, icon, colours and wording, or use the same client portal as a website in any browser. It's their choice. The app is published from your own Apple and Google developer accounts and is already connected to your system, so clients just sign in with a one-time code sent to their phone.",
    },
    {
      q: "Can we change plans later?",
      a: (
        <>
          Yes. Ask for an upgrade from inside the app or <Link to="/contact">contact us</Link>. Adding seats is the same.
        </>
      ),
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
      q: "How do we pay?",
      a: "By pre-authorized debit from a Canadian business bank account (the default), or by credit card, through Stripe's secure checkout. Annual billing is charged once a year; monthly billing every month. Onboarding fees are charged once with your first payment.",
    },
  ];
  return (
    <>
      <div className="wrap wrap--narrow page-head">
        <h1>Questions and answers</h1>
      </div>
      <div className="wrap wrap--narrow faq">
        {items.map((i) => (
          <details key={i.q}>
            <summary>{i.q}</summary>
            <p>{i.a}</p>
          </details>
        ))}
        <p style={{ marginTop: "2rem" }}>
          Still have a question? <Link to="/contact">Contact us</Link>.
        </p>
      </div>
    </>
  );
}
