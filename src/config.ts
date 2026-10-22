// One place for every build-time setting. The product name is not final: never hard-code it elsewhere.
const env = import.meta.env;

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export const PRODUCT_NAME: string = clean(env.VITE_PRODUCT_NAME) || "Keystone";
export const OPS_URL: string = clean(env.VITE_OPS_URL).replace(/\/+$/, "");
export const TURNSTILE_SITE_KEY: string = clean(env.VITE_TURNSTILE_SITE_KEY);
export const CONTACT_EMAIL: string = clean(env.VITE_CONTACT_EMAIL);
/** Optional JSON endpoint for the contact form. Empty = the form opens an email instead. */
export const CONTACT_ENDPOINT: string = clean(env.VITE_CONTACT_ENDPOINT);
export const SITE_URL: string = clean(env.VITE_SITE_URL).replace(/\/+$/, "");

export function opsUrl(path: string): string {
  return `${OPS_URL}${path}`;
}
