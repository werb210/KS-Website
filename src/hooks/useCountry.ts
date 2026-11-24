// KS_WEBSITE_COUNTRY_v1 - the visitor's country, shared by every page (the header switch changes it everywhere).
import { useSyncExternalStore } from "react";
import { detectCountry, saveCountry, type Country } from "../lib/country";

let current: Country | null = null;
const listeners = new Set<() => void>();
const get = (): Country => (current ??= detectCountry());

export function setCountry(c: Country): void {
  current = c;
  saveCountry(c);
  listeners.forEach((l) => l());
}
/** Tests. */
export function resetCountry(c: Country | null = null): void { current = c; listeners.forEach((l) => l()); }

export function useCountry(): [Country, (c: Country) => void] {
  const c = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, get, get);
  return [c, setCountry];
}
