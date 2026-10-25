// Real screenshots of the apps, made by scripts/screenshots (capture.mjs, then frame.mjs) from the apps' demo builds
// on their sample file (a fictional borrower, Sam Carter of Juniper Hollow Millwork). See scripts/screenshots/README.md.
import sizes from "../assets/screens/sizes.json";

export type ScreenName = keyof typeof sizes;

export const SCREEN_ALT: Record<ScreenName, string> = {
  "client-wizard": "The client app on an iPhone: step 3 of the 6-step application, with the business details filled in.",
  "client-portal": "The client's own portal after applying, showing their advisor and that the application is in review.",
  "client-calculator": "The loan calculator in the client app: payment per period, total interest and total cost for $250,000 over 60 months, with the payment schedule.",
  "portal-pipeline": "The staff portal's sales pipeline, with applications in columns from Received to Off to Lender.",
  "portal-documents": "An application's documents in the staff portal: bank statements read on upload, one flagged as edited after the bank created it.",
  "portal-financials": "Figures read from a client's financial statements, each with how sure the reader is.",
  "portal-banking": "Banking analysis: three months of statements combined, with a chart of deposits, withdrawals and ending balance.",
  "portal-credit": "A draft credit summary for an application, with a figure flagged to check.",
  "portal-fraud": "The fraud check: a score out of 100 with plain-English reasons, and tamper and statement-math results for each document.",
  "portal-lenders": "Lender matches for an application, with each lender's funding range and likelihood.",
  "portal-calculator": "The loan calculator: payment, total interest and a payment schedule for the requested amount.",
  "ipad-documents": "The staff portal on an iPad, showing an application's documents.",
};

const files = import.meta.glob("../assets/screens/*.{avif,webp,png}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const file = (name: string) => files[`../assets/screens/${name}`];

export type ScreenSources = { avif: string; webp: string; png: string; width: number; height: number; frame: string };

/** The files for one screen: avif and webp at 1x and 2x (srcset), and the PNG fallback. */
export function screenSources(name: ScreenName): ScreenSources | null {
  const s = sizes[name];
  if (!s) return null;
  const set = (ext: string) => `${file(`${name}-${s.width}.${ext}`)} ${s.width}w, ${file(`${name}-${s.width * 2}.${ext}`)} ${s.width * 2}w`;
  const png = file(`${name}.png`);
  if (!png) return null;
  return { avif: set("avif"), webp: set("webp"), png, width: s.width, height: s.height, frame: s.frame };
}

// Native-app screenshots (iPhone dialler, Apple Watch) can't be captured from a web build. Drop them into
// src/assets/screens/native/ as iphone-dialler.(png|jpg|webp) and apple-watch.(png|jpg|webp) and the Mobile apps
// page shows them in place of the drawings. See src/assets/screens/native/README.md.
const native = import.meta.glob("../assets/screens/native/*.{png,jpg,jpeg,webp}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export type NativeSlot = "iphone-dialler" | "apple-watch";

export function nativeScreen(slot: NativeSlot): string | null {
  const hit = Object.keys(native).find((k) => k.replace(/^.*\//, "").replace(/\.[a-z]+$/, "") === slot);
  return hit ? native[hit] : null;
}
