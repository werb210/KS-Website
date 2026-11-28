// KS_WEBSITE_COUNTRY_v1 (Todd, 2026-11-24) - the site shows Canada or the United States. Same prices, in CAD for Canada
// and USD for the US (a CAD $129 seat is USD $129). Picked, in order: ?country=US|CA in the address, the visitor's own
// choice (the switch in the header, remembered), then the browser's time zone (no location prompt), then the language.
export type Country = "CA" | "US";
const KEY = "ks_country";

// Every IANA zone that is Canadian. Anything else in the Americas reads as the US.
const CANADIAN_ZONES = new Set([
  "America/St_Johns", "America/Halifax", "America/Glace_Bay", "America/Moncton", "America/Goose_Bay", "America/Blanc-Sablon",
  "America/Toronto", "America/Montreal", "America/Nipigon", "America/Thunder_Bay", "America/Iqaluit", "America/Pangnirtung",
  "America/Atikokan", "America/Winnipeg", "America/Rainy_River", "America/Resolute", "America/Rankin_Inlet", "America/Regina",
  "America/Swift_Current", "America/Edmonton", "America/Cambridge_Bay", "America/Yellowknife", "America/Inuvik", "America/Creston",
  "America/Dawson_Creek", "America/Fort_Nelson", "America/Whitehorse", "America/Dawson", "America/Vancouver",
  "Canada/Atlantic", "Canada/Central", "Canada/Eastern", "Canada/Mountain", "Canada/Newfoundland", "Canada/Pacific", "Canada/Saskatchewan", "Canada/Yukon",
]);
const US_ZONE = /^(America\/(New_York|Detroit|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Nome|Boise|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+|Menominee|Adak|Metlakatla|Yakutat|Louisville|Indianapolis)|Pacific\/Honolulu|US\/.+)$/;

export const isCountry = (v: unknown): v is Country => v === "CA" || v === "US";

/** The country a time zone and language point to; null when they don't say. */
export function countryFromBrowser(timeZone: string | undefined, languages: readonly string[] = []): Country | null {
  const tz = String(timeZone ?? "");
  if (CANADIAN_ZONES.has(tz)) return "CA";
  if (US_ZONE.test(tz)) return "US";
  for (const l of languages) {
    const region = String(l).split("-")[1]?.toUpperCase();
    if (region === "CA") return "CA";
    if (region === "US") return "US";
  }
  return null;
}

function stored(): Country | null {
  try { const v = window.localStorage.getItem(KEY); return isCountry(v) ? v : null; } catch { return null; }
}

/** The visitor's country. Canada when nothing points either way. */
export function detectCountry(search: string = typeof window === "undefined" ? "" : window.location.search): Country {
  const q = new URLSearchParams(search).get("country")?.toUpperCase();
  if (isCountry(q)) return q;
  const s = typeof window === "undefined" ? null : stored();
  if (s) return s;
  let tz: string | undefined;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { tz = undefined; }
  const langs = typeof navigator === "undefined" ? [] : (navigator.languages ?? [navigator.language]);
  return countryFromBrowser(tz, langs) ?? "CA";
}

export function saveCountry(c: Country): void {
  try { window.localStorage.setItem(KEY, c); } catch { /* private mode */ }
}

export const currencyOf = (c: Country): "CAD" | "USD" => (c === "US" ? "USD" : "CAD");
