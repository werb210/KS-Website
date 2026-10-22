import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

export type PlanName = "Starter" | "Growth" | "Pro";

export type FraudCheck = { n: number; name: string; plan: PlanName; body: string; needs?: string };

// The 15 checks and the plan that first includes each one (starter 1, 2, 4, 5; growth adds 6, 7, 8; pro has all).
// Numbers match the plan keys (fraud_<n>). There is no check 3: Keystone does not connect to client bank accounts.
export const CHECKS: FraudCheck[] = [
  { n: 1, plan: "Starter", name: "Document tamper scan", body: "Every upload is checked for signs of editing: made with a PDF or photo editor, saved more than once, the same font embedded twice, typed figures laid over a scanned page, pages saved at different quality. Each document gets a red, amber or green badge with the reasons." },
  { n: 2, plan: "Starter", name: "Bank statement math check", body: "Every transaction on each statement is re-added. Running balances, and opening balance plus transactions against the closing balance, have to agree. Edited amounts almost always break the chain." },
  { n: 4, plan: "Starter", name: "Duplicate document check", body: "Spots the same file, or a near-identical picture of the same ID or void cheque, already used on an application for a different business." },
  { n: 5, plan: "Starter", name: "Revenue vs bank deposits", body: "Compares the revenue on tax returns, financial statements and the application with the money actually deposited, allowing 40% for cash sales, other accounts and timing, and explains any gap." },
  { n: 6, plan: "Growth", name: "Business reality check", body: "Looks the business up in the federal corporate registry and checks the applicant is a director, flags PO boxes, mail drops and virtual offices, and checks how long the website has existed and what kind of phone line the business uses.", needs: "The federal registry lookup needs a free Corporations Canada API key." },
  { n: 7, plan: "Growth", name: "Phone and email risk", body: "Flags internet (VoIP) and prepaid phone lines, throwaway email addresses, email domains registered last month, and email addresses that look nothing like the applicant." },
  { n: 8, plan: "Growth", name: "ID checks", body: "Matches the name and date of birth on the ID with the application, and spots screenshots passed off as photos, edited ID images and the same ID picture used on another file." },
  { n: 9, plan: "Pro", name: "Device and location check", body: "Notices several businesses applying from the same device or connection, VPNs and data-centre connections, and applications made from outside the country or province you lend in." },
  { n: 10, plan: "Pro", name: "Application behaviour signals", body: "Notices bank and ID numbers pasted rather than typed, applications filled in faster than a person can type, and answers identical to another business's application. No keystrokes are recorded." },
  { n: 11, plan: "Pro", name: "Loan stacking detector", body: "Finds recent cash advances and daily or weekly repayments to other lenders in the uploaded bank statements that the applicant did not mention." },
  { n: 12, plan: "Pro", name: "Fraud network map", body: "Links applications that share a phone number, email, address, bank account, device or director, and shows the network as a picture, with files confirmed as fraud in red." },
  { n: 13, plan: "Pro", name: "Shared fraud watchlist", body: `Opt in, and confirmed fraud is shared with other ${PRODUCT_NAME} brokerages as scrambled codes only. New applicants are checked against what the others reported. Turning it off removes everything you shared.` },
  { n: 14, plan: "Pro", name: "Inside-job alerts", body: "Your Admins are alerted when someone on your team changes the banking details on a file, exports in bulk, approves a file they submitted, or works through the night." },
  { n: 15, plan: "Pro", name: "Call voice check", body: "Recorded calls with the applicant can be checked for synthetic or cloned voices.", needs: "Needs a voice-analysis service. Until one is connected the check says so; it never guesses." },
  { n: 16, plan: "Pro", name: "Fraud score and lender pre-screen", body: "One 0 to 100 score per application with plain-English reasons, shown before you submit to a lender, and a pre-screened summary page you can add to the lender package." },
];

const PLANS: PlanName[] = ["Starter", "Growth", "Pro"];
const RANK: Record<PlanName, number> = { Starter: 0, Growth: 1, Pro: 2 };

export function includedIn(check: FraudCheck, plan: PlanName): boolean {
  return RANK[plan] >= RANK[check.plan];
}

const GROUPS: Array<{ title: string; intro: string; ns: number[] }> = [
  { title: "The documents", intro: "Bank statements, tax returns, IDs and void cheques, checked the moment they are uploaded.", ns: [1, 2, 4] },
  { title: "The money", intro: "Whether the numbers on paper match the deposits on the bank statements.", ns: [5, 11] },
  { title: "The business and the people", intro: "Whether the business and the applicant are who they say they are.", ns: [6, 7, 8] },
  { title: "How they applied", intro: "Signals from the application itself, collected without recording what anyone typed.", ns: [9, 10] },
  { title: "Across files and brokerages", intro: "Fraudsters reuse details. These checks connect the dots.", ns: [12, 13] },
  { title: "Your own team and your calls", intro: "Protection from the inside, too.", ns: [14, 15] },
  { title: "The score", intro: "Everything above, in one number you can act on.", ns: [16] },
];

const byN = new Map(CHECKS.map((c) => [c.n, c]));

function PlanTag({ plan }: { plan: PlanName }) {
  if (plan === "Starter") return null;
  return (
    <span className="small" style={{ fontWeight: 500, color: "var(--accent-ink)", marginLeft: "0.5rem" }}>
      {plan === "Pro" ? "Pro" : "Growth and Pro"}
    </span>
  );
}

export default function FraudProtection() {
  usePageMeta(
    "Fraud protection",
    `${PRODUCT_NAME} checks every application for edited statements, duplicate IDs, loan stacking and fraud networks before it reaches a lender.`,
    "/fraud-protection",
  );
  return (
    <>
      <div className="wrap page-head">
        <h1>Fraud protection</h1>
        <p className="lede">
          Every application is checked automatically before it goes to a lender: the documents, the money, the business,
          the people and how they applied.
        </p>
        <p>
          Each result is a plain-English reason to look closer, never an automatic decline. When a check needs a service
          you have not connected, it says so instead of reporting all clear.
        </p>
      </div>

      <div className="wrap">
        {GROUPS.map((g) => (
          <section className="feature-area" key={g.title} aria-labelledby={`fraud-${g.ns[0]}`}>
            <div>
              <h2 id={`fraud-${g.ns[0]}`} style={{ fontSize: "var(--step-2)" }}>{g.title}</h2>
              <p className="muted">{g.intro}</p>
            </div>
            <ul>
              {g.ns.map((n) => {
                const c = byN.get(n)!;
                return (
                  <li key={n} data-testid={`fraud-check-${n}`}>
                    <strong>
                      {c.name}
                      <PlanTag plan={c.plan} />
                    </strong>
                    <span>{c.body}</span>
                    {c.needs && <span className="small" style={{ display: "block", marginTop: "0.3rem", color: "var(--stone)" }}>{c.needs}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="section section--surface" aria-labelledby="fraud-plans">
        <div className="wrap">
          <h2 id="fraud-plans">What each plan includes</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="fraud-table" data-testid="fraud-plan-table">
              <caption className="visually-hidden">Fraud-protection checks by plan</caption>
              <thead>
                <tr>
                  <th scope="col">Check</th>
                  {PLANS.map((p) => <th scope="col" key={p}>{p}</th>)}
                </tr>
              </thead>
              <tbody>
                {[...CHECKS].sort((a, b) => RANK[a.plan] - RANK[b.plan] || a.n - b.n).map((c) => (
                  <tr key={c.n}>
                    <th scope="row">{c.name}</th>
                    {PLANS.map((p) => (
                      <td key={p}>{includedIn(c, p) ? <span aria-label="Included">✓</span> : <span aria-label="Not included" style={{ color: "var(--stone)" }}>-</span>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "1.5rem" }}>
            <Link className="btn" to="/pricing">See plans and prices</Link>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="fraud-privacy">
        <div className="wrap wrap--narrow">
          <h2 id="fraud-privacy">Privacy built in</h2>
          <ul className="tick-list">
            <li>Applicants are never tracked keystroke by keystroke. The client app sends counts, such as how long the application took and which kinds of field were pasted into, never what was typed.</li>
            <li>The device is recognised by a random code the app makes for itself, not a hardware fingerprint. Device codes, internet addresses and answers are stored only in scrambled (hashed) form.</li>
            <li>Documents are compared by digital fingerprints. No extra copy of anyone's ID is made.</li>
            <li>The shared watchlist is opt-in and carries only scrambled codes of confirmed fraud. No names, numbers or files ever leave your brokerage.</li>
          </ul>
          <p>Read more in our <Link to="/privacy">privacy policy</Link>.</p>
        </div>
      </section>
    </>
  );
}
