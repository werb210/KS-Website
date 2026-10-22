import { useEffect } from "react";
import { PRODUCT_NAME, SITE_URL } from "../config";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** Per-page title, description and canonical link for search engines and link previews. */
export function usePageMeta(title: string, description: string, path?: string) {
  useEffect(() => {
    const full = title ? `${title} | ${PRODUCT_NAME}` : PRODUCT_NAME;
    document.title = full;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", full);
    setMeta('meta[property="og:description"]', "content", description);
    if (SITE_URL && path !== undefined) {
      setMeta('link[rel="canonical"]', "href", `${SITE_URL}${path}`);
      setMeta('meta[property="og:url"]', "content", `${SITE_URL}${path}`);
    }
  }, [title, description, path]);
}
