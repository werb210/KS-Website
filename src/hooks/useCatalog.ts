import { useEffect, useState } from "react";
import { FALLBACK_CATALOG, fetchCatalog, type Catalog } from "../lib/plans";
import { currencyOf } from "../lib/country";
import { useCountry } from "./useCountry";

let cache: { catalog: Catalog; source: "live" | "fallback" } | null = null;

/** Reset between tests. */
export function resetCatalogCache() {
  cache = null;
}

/**
 * Plans from KS-Ops. Shows the bundled copy straight away (so nothing jumps), then swaps in the live data.
 */
export function useCatalog() {
  const [state, setState] = useState<{ catalog: Catalog; source: "live" | "fallback" | "loading" }>(
    cache ?? { catalog: FALLBACK_CATALOG, source: "loading" },
  );
  useEffect(() => {
    if (cache) return;
    const ac = new AbortController();
    fetchCatalog(ac.signal)
      .then((r) => {
        cache = r;
        setState(r);
      })
      .catch(() => {
        /* aborted on unmount */
      });
    return () => ac.abort();
  }, []);
  // KS_WEBSITE_COUNTRY_v1 - the same prices, in USD for US visitors and CAD for Canadian ones.
  const [country] = useCountry();
  return { ...state, catalog: { ...state.catalog, currency: currencyOf(country) } };
}
