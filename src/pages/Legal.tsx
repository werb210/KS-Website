import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";

function DraftBanner() {
  return (
    <div className="draft-banner" role="note">
      DRAFT placeholder for legal counsel. This is not the final agreement and must not be relied on.
    </div>
  );
}

export function Terms() {
  usePageMeta("Terms of service (draft)", `Draft terms of service for ${PRODUCT_NAME}.`, "/terms");
  return (
    <div className="wrap wrap--narrow page-head">
      <DraftBanner />
      <h1>Terms of service</h1>
      <p className="muted">Draft for review by counsel. Last updated: not yet published.</p>
      <h2>Sections counsel needs to complete</h2>
      <ol>
        <li>Parties, the licensed software and the licensee's own copy.</li>
        <li>Seats, plans, allowances, overage, extra storage and price changes.</li>
        <li>Billing (annual and monthly), onboarding fees, taxes, refunds and late payment.</li>
        <li>The 14-day trial of Pro features on Starter.</li>
        <li>Acceptable use, including calling and texting rules (CASL, CRTC and, in the US, TCPA).</li>
        <li>The licensee's responsibilities for client consent, lender relationships and regulatory compliance.</li>
        <li>Data ownership, export on cancellation and deletion timelines.</li>
        <li>Third-party services (Microsoft Azure, Stripe, Twilio, OpenAI and others).</li>
        <li>Support levels and service availability.</li>
        <li>Warranties, limitation of liability and indemnities.</li>
        <li>Term, renewal, cancellation and suspension.</li>
        <li>Governing law and dispute resolution.</li>
      </ol>
    </div>
  );
}

export function Privacy() {
  usePageMeta("Privacy policy (draft)", `Draft privacy policy for ${PRODUCT_NAME}.`, "/privacy");
  return (
    <div className="wrap wrap--narrow page-head">
      <DraftBanner />
      <h1>Privacy policy</h1>
      <p className="muted">Draft for review by counsel. Last updated: not yet published.</p>
      <h2>Sections counsel needs to complete</h2>
      <ol>
        <li>Who we are and how to contact our privacy officer.</li>
        <li>What we collect on this website and at sign-up (company and contact details, payment handled by Stripe).</li>
        <li>Our role for the data licensees store in their own copy (service provider acting for the licensee).</li>
        <li>Where data is stored (Microsoft Azure, Canada Central) and service providers that process it.</li>
        <li>How long we keep data and how it's deleted.</li>
        <li>Cookies and analytics on this website.</li>
        <li>Rights under PIPEDA and provincial law (including Quebec Law 25), and US state laws where they apply.</li>
        <li>How to make a request or complaint.</li>
      </ol>
      <h2>Fraud-protection data (draft text for counsel)</h2>
      <p>
        {PRODUCT_NAME} checks loan applications for fraud on behalf of the brokerage using it. The brokerage decides which
        checks run (they depend on its plan) and is responsible for telling its applicants. The following is processed in
        the brokerage's own copy of {PRODUCT_NAME}:
      </p>
      <ul>
        <li>
          <strong>Uploaded documents:</strong> technical details of each file (which software made it, how it was saved,
          its fonts and page images) and digital fingerprints (hashes) used to spot the same file or picture on another
          application. No additional copy of an ID is made.
        </li>
        <li>
          <strong>The client app:</strong> a random device code the app creates for itself, the type of device, the
          internet address the application came from (stored only as a scrambled hash, together with the country, region
          and network it belongs to), how long the application took, how many fields were filled in, whether autofill was
          used, which kinds of sensitive field were pasted into, and a scrambled fingerprint of some answers. Keystrokes
          and the contents of fields are never recorded.
        </li>
        <li>
          <strong>Lookups with outside services</strong>, when the brokerage turns them on: the business number with the
          federal corporate registry (Corporations Canada), website and email domains with public domain registries
          (RDAP), phone numbers with Twilio to learn the line type, internet addresses with an IP-location service, and,
          for pro brokerages that connect them, bank data through Flinks and call recordings through a voice-analysis
          service.
        </li>
        <li>
          <strong>Staff activity</strong> in the brokerage's portal (for example, changes to banking details or bulk
          exports) to alert the brokerage's administrators. Only the kind of action is kept, not the values entered.
        </li>
        <li>
          <strong>Shared fraud watchlist (opt-in):</strong> when a brokerage confirms a file as fraud, scrambled codes
          (keyed hashes) of the phone numbers, email, business number, addresses, bank account and name with date of
          birth are sent to us, so other participating brokerages can be warned. We cannot turn these codes back into
          personal information. Withdrawing a file, or opting out, deletes what was shared.
        </li>
      </ul>
      <p>
        Results are signs for a person to review. They are not automated decisions to decline an application.
      </p>
    </div>
  );
}
