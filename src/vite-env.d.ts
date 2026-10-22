/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPS_URL?: string;
  readonly VITE_PRODUCT_NAME?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_CONTACT_EMAIL?: string;
  readonly VITE_CONTACT_ENDPOINT?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
