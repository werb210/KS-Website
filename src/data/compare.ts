// KS_WEBSITE_COMPARE_v1 - the data behind /compare. One file, so every claim about another product sits next to the
// public page it came from and the day it was checked.
//
// Rules (src/data/compare.test.ts checks them):
// - Our own column is only ever "yes" or "soon". A feature we don't have is either on BEING_BUILT ("soon") or the row
//   is not here at all.
// - Every competitor value names a source, and every source has a URL and the date it was checked.
// - Prices are list prices copied from the vendor's own public pages (or a public listing where the vendor publishes
//   none). No price is estimated. Where nothing is published the price is "Quote only" (fiveSeatMonthly: null).
// - "no" means the vendor's public site doesn't show it in the plan we priced. "unknown" means we couldn't confirm
//   either way, and the page says "Not stated".

export const CHECKED = "2026-10-26";
export const CHECKED_LABEL = "October 26, 2026";

/** Features being built now. A "soon" row must name one of these. */
export const BEING_BUILT = ["marketing_addon", "knowledge_base", "office_connect"] as const;
export type BeingBuilt = (typeof BEING_BUILT)[number];

export type Mark = "yes" | "addon" | "limited" | "no" | "unknown";
export type OurMark = "yes" | "soon";

export type Source = { id: string; title: string; url: string; checked: string };

export type CompetitorCell = { v: Mark; src: string; note?: string };
export type OurCell = { v: OurMark; note?: string; building?: BeingBuilt };

export type Area =
  | "CRM and pipeline"
  | "Client portal and application"
  | "Documents and e-signing"
  | "Fraud checks"
  | "Lenders"
  | "Phone and texting"
  | "Email and calendar"
  | "Marketing"
  | "Reporting"
  | "AI"
  | "Mobile apps"
  | "Security and data"
  | "Integrations"
  | "Support";

export const ROWS = [
  { id: "contacts", area: "CRM and pipeline", label: "Contacts and companies with a full activity timeline" },
  { id: "custom_fields", area: "CRM and pipeline", label: "Custom fields" },
  { id: "pipeline", area: "CRM and pipeline", label: "Visual deal pipeline" },
  { id: "automations", area: "CRM and pipeline", label: "Workflow automation" },
  { id: "loan_file", area: "CRM and pipeline", label: "Loan file built in: banking analysis, financials and credit summary" },
  { id: "application", area: "Client portal and application", label: "Branded online loan application" },
  { id: "borrower_portal", area: "Client portal and application", label: "Borrower portal: status, to-dos and uploads" },
  { id: "partner_portals", area: "Client portal and application", label: "Portals for referral partners and partner brokers" },
  { id: "documents", area: "Documents and e-signing", label: "Request and track borrower documents" },
  { id: "ocr", area: "Documents and e-signing", label: "Bank statements and financials read automatically on upload" },
  { id: "esign", area: "Documents and e-signing", label: "E-signatures" },
  { id: "fraud", area: "Fraud checks", label: "Document tamper and bank-statement fraud checks" },
  { id: "lender_match", area: "Lenders", label: "Lender matching for each deal" },
  { id: "submission", area: "Lenders", label: "Send the deal package to lenders" },
  { id: "calling", area: "Phone and texting", label: "Built-in business phone line and calling" },
  { id: "sms", area: "Phone and texting", label: "Two-way business texting" },
  { id: "email_sync", area: "Email and calendar", label: "Email inbox sync with Outlook (Microsoft 365)" },
  { id: "booking", area: "Email and calendar", label: "Booking pages for client calls" },
  { id: "campaigns", area: "Marketing", label: "Email and text campaigns" },
  { id: "visitor_tracking", area: "Marketing", label: "Website visitor tracking" },
  { id: "lead_scoring", area: "Marketing", label: "Lead scoring" },
  { id: "reports", area: "Reporting", label: "Dashboards and reports" },
  { id: "commissions", area: "Reporting", label: "Commission tracking" },
  { id: "ai_assistant", area: "AI", label: "AI assistant for staff" },
  { id: "staff_mobile", area: "Mobile apps", label: "Mobile app for staff" },
  { id: "client_app", area: "Mobile apps", label: "Branded borrower app for iPhone and Android" },
  { id: "canada", area: "Security and data", label: "Data can be kept in Canada" },
  { id: "api", area: "Integrations", label: "Open API and outgoing webhooks" },
  { id: "help_centre", area: "Support", label: "Help centre with AI answers" },
] as const satisfies ReadonlyArray<{ id: string; area: Area; label: string }>;

export type RowId = (typeof ROWS)[number]["id"];

/** Our column. Plan notes match src/lib/plans.ts (Starter, Growth, Pro). */
export const OURS: Record<RowId, OurCell> = {
  contacts: { v: "yes" },
  custom_fields: { v: "yes" },
  pipeline: { v: "yes", note: "Lending stages built in" },
  automations: { v: "yes", note: "Growth and Pro" },
  loan_file: { v: "yes" },
  application: { v: "yes", note: "6-step application with your branding" },
  borrower_portal: { v: "yes" },
  partner_portals: { v: "yes", note: "Growth and Pro" },
  documents: { v: "yes", note: "Checklist per lender product" },
  ocr: { v: "yes" },
  esign: { v: "yes", note: "Uses SignNow" },
  fraud: { v: "yes", note: "More checks on Growth and Pro" },
  lender_match: { v: "yes", note: "With the lenders you work with" },
  submission: { v: "yes", note: "By email or download link" },
  calling: { v: "yes", note: "Number set up for you; minutes included" },
  sms: { v: "yes", note: "Texts included" },
  email_sync: { v: "yes", note: "Gmail can send; Gmail inbox sync later" },
  booking: { v: "yes", note: "With reminders" },
  campaigns: { v: "yes" },
  visitor_tracking: { v: "yes", note: "Growth and Pro" },
  lead_scoring: { v: "soon", building: "marketing_addon", note: "Marketing add-on" },
  reports: { v: "yes", note: "Every report on Growth and Pro" },
  commissions: { v: "yes", note: "Growth and Pro" },
  ai_assistant: { v: "yes" },
  staff_mobile: { v: "yes", note: "iPhone dialler, iPad, Apple Watch (Growth and Pro)" },
  client_app: { v: "yes", note: "Listed under your own name" },
  canada: { v: "yes", note: "Your own server and database in Canada" },
  api: { v: "yes", note: "Pro" },
  help_centre: { v: "soon", building: "knowledge_base" },
};

export type Price = {
  /** The plan a 5-person brokerage would realistically buy. */
  tier: string;
  currency: "USD" | "CAD";
  /** List price per seat per month, or null when priced another way (or not published). */
  perSeat: number | null;
  /** What 5 seats cost a month at list price, or null when the vendor publishes no price. */
  fiveSeatMonthly: number | null;
  billing: string;
  /** One-time fee, when the vendor publishes one. */
  oneTime?: number;
  note?: string;
  src: string;
};

export type Competitor = {
  id: string;
  name: string;
  /** "general" CRMs are used by brokers but not built for lending; "lending" ones are. */
  kind: "general" | "lending";
  /** 1 = most commonly used by commercial-lending brokers, by our reading of the sources. */
  rank: number;
  why: string;
  price: Price;
  sources: Source[];
  cells: Record<RowId, CompetitorCell>;
};

const s = (id: string, title: string, url: string): Source => ({ id, title, url, checked: CHECKED });

// Shorthand for cells.
const y = (src: string, note?: string): CompetitorCell => ({ v: "yes", src, note });
const n = (src: string, note?: string): CompetitorCell => ({ v: "no", src, note });
const a = (src: string, note: string): CompetitorCell => ({ v: "addon", src, note });
const l = (src: string, note: string): CompetitorCell => ({ v: "limited", src, note });
const u = (src: string): CompetitorCell => ({ v: "unknown", src });

const LENDFLOW = "https://www.lendflow.com/post/commercial-loan-broker-crm";
const WIFI = "https://wifitalents.com/best/finance-broker-crm-software/";

export const COMPETITORS: Competitor[] = [
  {
    id: "salesforce",
    name: "Salesforce Sales Cloud",
    kind: "general",
    rank: 1,
    why: "The most widely used CRM overall, and named in broker CRM round-ups for its flexibility. Brokers usually customise it for lending.",
    price: { tier: "Pro Suite", currency: "USD", perSeat: 100, fiveSeatMonthly: 500, billing: "billed annually", note: "Salesforce's Canadian site lists prices in USD. API access is USD $25 per user a month extra on this plan", src: "ca" },
    sources: [
      s("price", "Salesforce: Sales Cloud pricing", "https://www.salesforce.com/products/sales-cloud-pricing/"),
      s("ca", "Salesforce Canada: Sales Cloud pricing (USD)", "https://www.salesforce.com/ca/sales/pricing/"),
      s("portal", "Salesforce: Self-Service (customer portal) pricing", "https://www.salesforce.com/products/customer-self-service-pricing/"),
      s("usage", "Lendflow: CRMs for commercial loan brokers", LENDFLOW),
    ],
    cells: {
      contacts: y("price"),
      custom_fields: y("price"),
      pipeline: y("price"),
      automations: y("price"),
      loan_file: n("price"),
      application: n("price"),
      borrower_portal: a("portal", "Portal licences sold separately"),
      partner_portals: a("portal", "Portal licences sold separately"),
      documents: u("price"),
      ocr: n("price"),
      esign: u("price"),
      fraud: n("price"),
      lender_match: n("price"),
      submission: n("price"),
      calling: u("price"),
      sms: u("price"),
      email_sync: u("price"),
      booking: u("price"),
      campaigns: u("price"),
      visitor_tracking: u("price"),
      lead_scoring: l("price", "Opportunity scoring is listed for the Core edition"),
      reports: y("price"),
      commissions: u("price"),
      ai_assistant: l("price", "Agentforce is listed for the Core edition"),
      staff_mobile: y("price"),
      client_app: n("price"),
      canada: u("price"),
      api: a("price", "$25 per user a month on Pro Suite; included in Core"),
      help_centre: u("price"),
    },
  },
  {
    id: "hubspot",
    name: "HubSpot Sales Hub",
    kind: "general",
    rank: 2,
    why: "Very common with small brokerages for lead generation and follow-up; has a free tier. Named in broker CRM round-ups.",
    price: { tier: "Professional", currency: "CAD", perSeat: 117, fiveSeatMonthly: 585, billing: "billed annually (CAD $650 a month paid monthly)", oneTime: 1950, note: "Canadian pricing from HubSpot's price calculator; CAD $1,950 one-time onboarding. Marketing Hub Professional, needed for marketing email at scale, is CAD $1,034 a month more on an annual commitment.", src: "cad" },
    sources: [
      s("price", "HubSpot: Sales Hub pricing", "https://www.hubspot.com/pricing/sales"),
      s("cad", "HubSpot: price calculator in CAD (Sales Hub Professional, 5 seats)", "https://www.hubspot.com/pricing/bundle?products=sales-hub-professional_5"),
      s("guide", "HubSpot: Sales Hub pricing guide", "https://blog.hubspot.com/sales/hubspot-sales-hub-pricing"),
      s("product", "HubSpot: Sales Hub features", "https://www.hubspot.com/products/sales"),
      s("portal", "HubSpot: Set up a customer portal", "https://knowledge.hubspot.com/inbox/set-up-a-customer-portal"),
      s("sms", "HubSpot: Create and send SMS messages", "https://knowledge.hubspot.com/sms/create-and-send-sms-messages"),
      s("dc", "HubSpot: Data centres", "https://www.hubspot.com/data-centers"),
      s("usage", "Lendflow: CRMs for commercial loan brokers", LENDFLOW),
    ],
    cells: {
      contacts: y("product"),
      custom_fields: y("price"),
      pipeline: y("product"),
      automations: y("guide", "300 workflows on Professional"),
      loan_file: n("product"),
      application: l("product", "General web forms, not a loan application"),
      borrower_portal: a("portal", "Needs Service Hub Professional or Enterprise"),
      partner_portals: u("product"),
      documents: l("product", "Sales content library, not borrower document requests"),
      ocr: n("product"),
      esign: y("guide", "Through an e-signature integration"),
      fraud: n("product"),
      lender_match: n("product"),
      submission: n("product"),
      calling: y("guide", "3,000 calling minutes on Professional"),
      sms: a("sms", "SMS add-on with Marketing Hub"),
      email_sync: u("product"),
      booking: y("product", "Meeting scheduling links"),
      campaigns: a("sms", "Marketing Hub"),
      visitor_tracking: u("product"),
      lead_scoring: y("product"),
      reports: y("product"),
      commissions: u("product"),
      ai_assistant: y("product", "Breeze Assistant"),
      staff_mobile: y("product"),
      client_app: n("product"),
      canada: y("dc"),
      api: y("product", "Developer tools and app marketplace"),
      help_centre: u("product"),
    },
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    kind: "general",
    rank: 3,
    why: "A low-cost general CRM that tops some finance-broker CRM lists; popular with small teams.",
    price: { tier: "Enterprise", currency: "USD", perSeat: 40, fiveSeatMonthly: 200, billing: "billed annually", src: "price" },
    sources: [
      s("price", "Zoho: CRM Enterprise edition", "https://www.zoho.com/crm/zohocrm-pricing-enterprise.html"),
      s("pro", "Zoho: CRM Professional edition", "https://www.zoho.com/crm/zohocrm-pricing-professional.html"),
      s("usage", "WifiTalents: Best finance broker CRM software", WIFI),
    ],
    cells: {
      contacts: y("price"),
      custom_fields: y("price"),
      pipeline: y("price"),
      automations: y("price", "Workflows and approvals"),
      loan_file: n("price"),
      application: l("price", "General web forms, not a loan application"),
      borrower_portal: l("pro", "Custom portals, not built for loan applicants"),
      partner_portals: l("pro", "Custom portals, not built for partners"),
      documents: u("price"),
      ocr: n("price"),
      esign: u("price"),
      fraud: n("price"),
      lender_match: n("price"),
      submission: n("price"),
      calling: u("price"),
      sms: u("price"),
      email_sync: u("price"),
      booking: u("price"),
      campaigns: u("price"),
      visitor_tracking: u("price"),
      lead_scoring: y("price"),
      reports: y("price"),
      commissions: u("price"),
      ai_assistant: y("price", "Zia"),
      staff_mobile: u("price"),
      client_app: n("price"),
      canada: u("price"),
      api: u("price"),
      help_centre: u("price"),
    },
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    kind: "general",
    rank: 4,
    why: "A simple visual pipeline that many small brokerages start on. Named in broker CRM round-ups.",
    price: { tier: "Premium", currency: "CAD", perSeat: 79, fiveSeatMonthly: 395, billing: "billed annually (CAD $948 per seat a year)", note: "Canadian pricing from Pipedrive's site. The first plan with built-in e-signatures", src: "price" },
    sources: [
      s("price", "Pipedrive: Pricing", "https://www.pipedrive.com/en/pricing"),
      s("calls", "Pipedrive: How can I make calls in Pipedrive?", "https://support.pipedrive.com/en/article/how-can-i-make-calls-in-pipedrive"),
      s("dc", "Pipedrive: How secure is my data in Pipedrive?", "https://support.pipedrive.com/en/article/how-secure-is-my-data-in-pipedrive"),
      s("usage", "Lendflow: CRMs for commercial loan brokers", LENDFLOW),
    ],
    cells: {
      contacts: y("price"),
      custom_fields: y("price"),
      pipeline: y("price"),
      automations: y("price"),
      loan_file: n("price"),
      application: a("price", "Web forms come with the LeadBooster add-on"),
      borrower_portal: u("price"),
      partner_portals: u("price"),
      documents: a("price", "Smart Docs add-on"),
      ocr: n("price"),
      esign: y("price"),
      fraud: n("price"),
      lender_match: n("price"),
      submission: n("price"),
      calling: a("calls", "Through marketplace apps"),
      sms: a("calls", "Through marketplace apps"),
      email_sync: y("price", "Full email sync with tracking"),
      booking: u("price"),
      campaigns: a("price", "Campaigns add-on"),
      visitor_tracking: a("price", "Web Visitors add-on"),
      lead_scoring: u("price"),
      reports: y("price"),
      commissions: u("price"),
      ai_assistant: u("price"),
      staff_mobile: u("price"),
      client_app: n("price"),
      canada: y("dc", "Canadian sign-ups are mainly hosted in Montreal"),
      api: u("price"),
      help_centre: u("price"),
    },
  },
  {
    id: "salesforce-fsc",
    name: "Salesforce Financial Services Cloud",
    kind: "lending",
    rank: 5,
    why: "Salesforce's financial-services edition, with financial data models. Suits larger teams with an admin.",
    price: { tier: "Sales Core", currency: "USD", perSeat: 325, fiveSeatMonthly: 1625, billing: "billed annually", src: "price" },
    sources: [
      s("price", "Salesforce: Financial Services Cloud for Sales pricing", "https://www.salesforce.com/financial-services/sales-pricing/"),
      s("editions", "Salesforce: Financial Services Cloud for Sales & Service pricing", "https://www.salesforce.com/financial-services/sales-service-pricing/"),
      s("portal", "Salesforce: Self-Service (customer portal) pricing", "https://www.salesforce.com/products/customer-self-service-pricing/"),
      s("usage", "Lendflow: CRMs for commercial loan brokers", LENDFLOW),
    ],
    cells: {
      contacts: y("price"),
      custom_fields: y("price"),
      pipeline: y("price"),
      automations: y("price"),
      loan_file: a("editions", "Digital Origination add-on; included in the Max edition"),
      application: a("editions", "Digital Origination add-on; included in the Max edition"),
      borrower_portal: a("portal", "Portal licences sold separately"),
      partner_portals: a("portal", "Portal licences sold separately"),
      documents: y("price", "Document tracking and approvals"),
      ocr: u("price"),
      esign: u("price"),
      fraud: u("price"),
      lender_match: u("price"),
      submission: u("price"),
      calling: u("price"),
      sms: u("price"),
      email_sync: u("price"),
      booking: u("price"),
      campaigns: u("price"),
      visitor_tracking: u("price"),
      lead_scoring: u("price"),
      reports: y("price"),
      commissions: u("price"),
      ai_assistant: y("editions", "Agentforce credits included"),
      staff_mobile: u("price"),
      client_app: n("price"),
      canada: u("price"),
      api: u("price"),
      help_centre: u("price"),
    },
  },
  {
    id: "centrex",
    name: "Centrex",
    kind: "lending",
    rank: 6,
    why: "A CRM built for business-loan, MCA, equipment-leasing and factoring brokers; one of the longest-standing in the niche.",
    price: { tier: "Quote only", currency: "USD", perSeat: null, fiveSeatMonthly: null, billing: "", note: "Pricing on request", src: "pricing" },
    sources: [
      s("crm", "Centrex: CRM software", "https://centrexsoftware.com/crm-software/"),
      s("pricing", "Software Advice: Centrex (pricing on request)", "https://www.softwareadvice.com/loan-origination/centrex-profile/"),
      s("listing", "GetApp: Centrex CRM", "https://www.getapp.com/finance-accounting-software/a/centrex-crm-software/"),
      s("usage", "Lendflow: CRMs for commercial loan brokers", LENDFLOW),
    ],
    cells: {
      contacts: y("crm"),
      custom_fields: u("crm"),
      pipeline: y("listing"),
      automations: y("crm", "Custom workflows"),
      loan_file: l("crm", "Bank data through Plaid for underwriting models"),
      application: l("crm", "Web form integration"),
      borrower_portal: y("crm"),
      partner_portals: y("listing", "Branded portal for ISOs and affiliates"),
      documents: y("crm"),
      ocr: u("crm"),
      esign: y("crm", "ClixSign"),
      fraud: u("crm"),
      lender_match: y("listing", "Lender matchmaking"),
      submission: y("crm"),
      calling: a("crm", "Phone systems such as Twilio and YTel"),
      sms: y("crm"),
      email_sync: u("crm"),
      booking: u("crm"),
      campaigns: y("crm", "Email and text blasts"),
      visitor_tracking: u("crm"),
      lead_scoring: u("crm"),
      reports: y("crm"),
      commissions: y("usage", "Commission management"),
      ai_assistant: u("crm"),
      staff_mobile: y("crm"),
      client_app: u("crm"),
      canada: u("crm"),
      api: u("crm"),
      help_centre: u("crm"),
    },
  },
  {
    id: "lendingwise",
    name: "LendingWise",
    kind: "lending",
    rank: 7,
    why: "A loan origination system with a broker edition, used by private and commercial lenders and the brokers who work with them.",
    price: { tier: "Pro (5 users included)", currency: "USD", perSeat: null, fiveSeatMonthly: 600, billing: "billed annually", note: "Flat monthly price for up to 5 users", src: "price" },
    sources: [s("price", "LendingWise: Pricing information", "https://help.lendingwise.com/knowledge/pricing-information")],
    cells: {
      contacts: y("price", "Contact manager"),
      custom_fields: l("price", "Elite plan"),
      pipeline: y("price"),
      automations: y("price", "Rules engine and webhooks"),
      loan_file: u("price"),
      application: y("price", "Quick and full application"),
      borrower_portal: y("price"),
      partner_portals: y("price", "Broker and loan officer portals"),
      documents: y("price"),
      ocr: u("price"),
      esign: y("price", "Unlimited e-signing"),
      fraud: u("price"),
      lender_match: y("price", "Lender marketplace and deal room"),
      submission: y("price", "Deal room"),
      calling: u("price"),
      sms: u("price"),
      email_sync: u("price"),
      booking: u("price"),
      campaigns: y("price", "Bulk email marketing"),
      visitor_tracking: u("price"),
      lead_scoring: u("price"),
      reports: y("price", "Dashboard"),
      commissions: u("price"),
      ai_assistant: u("price"),
      staff_mobile: u("price"),
      client_app: u("price"),
      canada: u("price"),
      api: a("price", "Open API is a Pro add-on; included in Elite"),
      help_centre: u("price"),
    },
  },
  {
    id: "cloudsquare",
    name: "Cloudsquare Broker",
    kind: "lending",
    rank: 8,
    why: "A Salesforce-based system built for merchant cash advance and small-business finance brokers.",
    price: { tier: "Broker", currency: "USD", perSeat: 75, fiveSeatMonthly: 375, billing: "as published by the vendor", note: "Runs in your own Salesforce; the vendor's page doesn't say whether Salesforce licences are extra", src: "price" },
    sources: [
      s("home", "Cloudsquare: Home page", "https://cloudsquare.io/"),
      s("price", "Cloudsquare: Centrex pricing guide (states the Cloudsquare Broker price)", "https://cloudsquare.io/centrex-software-pricing/"),
      s("listing", "Capterra: Cloudsquare Broker", "https://www.capterra.com/p/180221/BrokerSuite/"),
    ],
    cells: {
      contacts: y("home"),
      custom_fields: u("home"),
      pipeline: y("home"),
      automations: y("listing", "Configurable workflows"),
      loan_file: y("home", "Cash flow analysis grades each file"),
      application: y("home"),
      borrower_portal: y("home"),
      partner_portals: u("home"),
      documents: y("home"),
      ocr: l("home", "Bank statement analysis; OCR not named"),
      esign: a("home", "E-sign apps from the Salesforce AppExchange"),
      fraud: u("home"),
      lender_match: u("home"),
      submission: y("home", "One-click submission to integrated lenders"),
      calling: y("home", "Automated dialling"),
      sms: y("home", "Text follow-up"),
      email_sync: u("home"),
      booking: u("home"),
      campaigns: u("home"),
      visitor_tracking: u("home"),
      lead_scoring: u("home"),
      reports: y("home"),
      commissions: y("home"),
      ai_assistant: y("home", "Cloudsquare AI"),
      staff_mobile: u("home"),
      client_app: u("home"),
      canada: u("home"),
      api: u("home"),
      help_centre: u("home"),
    },
  },
];

/** The default view: us, then these two. */
export const DEFAULT_COMPARE: [string, string] = ["salesforce", "hubspot"];

/** Products we looked at and left out, and why. Shown on the page so the choice is transparent. */
export const LEFT_OUT: Array<{ name: string; why: string }> = [
  { name: "Floify, Finmo, Filogix, BNTouch, Velocify, Jungo", why: "Built for residential mortgages, not commercial or equipment lending." },
  { name: "Lendflow", why: "A lending network and API for platforms, not a CRM a brokerage runs on." },
  { name: "LendSaaS", why: "Mainly for merchant cash advance funders, and its prices aren't published." },
];

export function competitor(id: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.id === id);
}

export function sourceOf(c: Competitor, id: string): Source | undefined {
  return c.sources.find((x) => x.id === id);
}
