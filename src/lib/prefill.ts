// Hands the details from someone's demo to Sign up and Contact. Links from the demo carry
// "#demo=<id>&k=<key>" (a fragment, so it never reaches a server log); KS-Ops swaps those for the name, email,
// brokerage and phone they gave. Without such a link, what they typed on "Try it yourself" in this browser is used.
import { useEffect, useState } from "react";
import { fetchDemoContact, type DemoContact } from "./api";
import { DEMO_CONTACT_KEY, loadLocal, saveLocal } from "./storage";

export function parseDemoHash(hash: string): { id: string; key: string } | null {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const id = p.get("demo") ?? "";
  const key = p.get("k") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) return null;
  return { id, key };
}

function clean(c: Partial<DemoContact> | null | undefined): DemoContact | null {
  if (!c || typeof c !== "object") return null;
  const s = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 200) : "");
  const out = { name: s(c.name), email: s(c.email), company: s(c.company), phone: s(c.phone) };
  return out.name || out.email || out.company || out.phone ? out : null;
}

export function rememberDemoContact(c: DemoContact): void {
  saveLocal(DEMO_CONTACT_KEY, clean(c));
}

/** Removes the demo id and key from the address bar once they have been read. */
function dropHash() {
  try {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  } catch {
    /* not available */
  }
}

/** The demo details for this visit, or null. Resolves once. */
export function useDemoContact(): DemoContact | null {
  const [contact, setContact] = useState<DemoContact | null>(null);
  useEffect(() => {
    let alive = true;
    const fromHash = parseDemoHash(window.location.hash);
    if (fromHash) {
      dropHash();
      void fetchDemoContact(fromHash.id, fromHash.key).then((c) => {
        const got = clean(c);
        if (got) rememberDemoContact(got);
        if (alive) setContact(got ?? clean(loadLocal<DemoContact>(DEMO_CONTACT_KEY)));
      });
    } else {
      setContact(clean(loadLocal<DemoContact>(DEMO_CONTACT_KEY)));
    }
    return () => {
      alive = false;
    };
  }, []);
  return contact;
}
