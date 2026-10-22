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
    </div>
  );
}
