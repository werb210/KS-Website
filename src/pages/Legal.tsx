import { CONTACT_EMAIL, PRODUCT_NAME } from "../config";
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
        <li>Parties, the licensed software and the licensee's own workspace.</li>
        <li>Seats, plans, allowances, overage, extra storage and price changes.</li>
        <li>Billing (annual and monthly), onboarding fees, taxes, refunds and late payment.</li>
        <li>The 14-day trial of Pro features on Starter and Growth.</li>
        <li>Acceptable use, including calling and texting rules (CASL, CRTC and, in the US, TCPA).</li>
        <li>The licensee's responsibilities for client consent, lender relationships and regulatory compliance.</li>
        <li>Data ownership, export on cancellation, the 7-year record retention, legal holds and deletion timelines.</li>
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
  // KS_WEBSITE_PRIVACY_POLICY_v1 - the published privacy policy (website, sign-up, the staff apps and the client app).
  usePageMeta("Privacy policy", `How ${PRODUCT_NAME} collects, uses and protects personal information.`, "/privacy");
  const contact = CONTACT_EMAIL || "sales@keystonecrm.online";
  return (
    <div className="wrap wrap--narrow page-head">
      <h1>Privacy policy</h1>
      <p className="muted">Last updated: November 10, 2026.</p>

      <h2>Who we are</h2>
      <p>
        {PRODUCT_NAME} is software that lending brokerages license to run their business: a staff portal and iPad app,
        a staff dialler app for iPhone and Apple Watch, and a client app and client portal. This policy explains what
        personal information we handle, why, and the choices you have. Questions or requests go to our privacy contact
        at <a href={`mailto:${contact}`}>{contact}</a>.
      </p>

      <h2>Two roles: our own customers, and the brokerages' clients</h2>
      <p>
        <strong>For our customers</strong> (the brokerages that sign up and their staff) we decide what is collected and
        why. <strong>For the information a brokerage keeps in {PRODUCT_NAME}</strong> (its clients, applications,
        documents, calls and messages) we act as a service provider on the brokerage's behalf. The brokerage decides what
        it collects and how it uses it, and its own privacy policy applies. If you are a client of a brokerage, contact
        that brokerage first; we will help it answer your request.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>On this website and at sign-up:</strong> your name, company, work email, phone number, the plan and
          seats you choose, your branding (logo, colours, website address), and messages you send us. Payments are
          handled by Stripe; we never see or store full card or bank account numbers.
        </li>
        <li>
          <strong>Staff accounts:</strong> name, work email, mobile number (used for sign-in codes), role, and sign-in
          and security events.
        </li>
        <li>
          <strong>Staff apps (iPad portal and dialler):</strong> calls and texts the staff member makes and receives
          through the brokerage's phone numbers, call recordings and transcripts where the brokerage turns them on, the
          microphone only during a call, the camera only when the staff member scans or photographs a document, and a
          device token so the app can ring and send notifications. If the staff member allows it, the dialler reads the
          phone's contacts to show caller names; contacts are matched on the device and are not uploaded.
        </li>
        <li>
          <strong>Client app and client portal (for a brokerage):</strong> the application details, business and owner
          information, documents, signatures, messages and the consents the client gives. See the fraud-protection
          section below for the device and file checks the brokerage can use.
        </li>
        <li>
          <strong>Usage and diagnostics:</strong> pages and screens used, errors and crash reports, device type and app
          version, so we can keep the service working. We do not sell personal information or use it for advertising
          outside {PRODUCT_NAME}.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide, secure and support the service, including sign-in codes, call routing and notifications.</li>
        <li>To bill our customers and send account and service messages.</li>
        <li>To answer questions, and, for people who ask us about {PRODUCT_NAME}, to follow up; you can unsubscribe at any time.</li>
        <li>To meet legal obligations, such as record keeping and responding to lawful requests.</li>
      </ul>
      <p>
        Some features use artificial intelligence (for example, call notes and document reading). These run for the
        brokerage on its own data and are not used to train outside models.
      </p>

      <h2>Where it is stored and who processes it</h2>
      <p>
        Data is stored in Canada, in Microsoft Azure's Canada Central region, and each brokerage has its own database.
        We use service providers that process data only to provide their service to us, under contract: Microsoft Azure
        (hosting), Twilio (calls, texts and sign-in codes), Stripe (payments), SendGrid (email), SignNow (e-signing),
        OpenAI (AI features), and, where a brokerage turns them on, identity-verification and bank-data services. Some of
        these providers may process data outside Canada, including in the United States, where it may be subject to the
        laws of that country.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Account information is kept while the account is open and as long as needed afterwards for legal and accounting
        reasons. Applications, uploaded documents, signed agreements, lender packages and the audit log are kept for 7
        years after a file closes, unless the brokerage places a legal hold. When a brokerage leaves, it can export all of
        its data; its workspace is then deleted on the schedule in its agreement.
      </p>

      <h2>How we protect it</h2>
      <p>
        Data is encrypted in transit and at rest, each brokerage's data is kept in its own database, staff sign in with
        one-time codes, passkeys or Face ID, and access is limited by role and logged.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        You can ask to see, correct or delete your personal information, withdraw consent (for example, reply STOP to
        stop texts or use the unsubscribe link in emails), or complain about how it is handled. Rights under Canada's
        PIPEDA, provincial laws including Quebec's Law 25, and US state laws apply where relevant. We answer within 30
        days. If you are not satisfied, you can contact the Office of the Privacy Commissioner of Canada or your
        provincial commissioner.
      </p>

      <h2>Cookies</h2>
      <p>
        This website uses cookies needed for it to work and, with your consent where required, analytics to understand
        how it is used. You can block cookies in your browser.
      </p>

      <h2>Children</h2>
      <p>{PRODUCT_NAME} is a business service and is not meant for anyone under 18.</p>

      <h2 id="fraud">Fraud-protection data</h2>
      <p>
        {PRODUCT_NAME} checks loan applications for fraud on behalf of the brokerage using it. The brokerage decides which
        checks run (they depend on its plan) and is responsible for telling its applicants. The following is processed in
        the brokerage's own workspace in {PRODUCT_NAME}:
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
          for pro brokerages that connect one, call recordings through a voice-analysis service.
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

      <h2>Changes</h2>
      <p>
        We will post any change here with a new date, and tell our customers about important changes before they take
        effect.
      </p>
    </div>
  );
}
