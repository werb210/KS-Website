// The font choice on the sign-up branding step: the font the licensee's client app and pages use. Stored as a family
// name only (KS-Ops licensees.font_family -> KS-server licensee settings).

export type FontOption = { family: string; kind: "system" | "google"; style: "sans" | "serif" };

/** Fonts every device has (no download). */
export const SYSTEM_FONTS: FontOption[] = [
  { family: "Arial", kind: "system", style: "sans" },
  { family: "Verdana", kind: "system", style: "sans" },
  { family: "Tahoma", kind: "system", style: "sans" },
  { family: "Trebuchet MS", kind: "system", style: "sans" },
  { family: "Georgia", kind: "system", style: "serif" },
  { family: "Times New Roman", kind: "system", style: "serif" },
];

/** Readable Google Fonts, loaded by the apps from Google Fonts. */
export const GOOGLE_FONTS: FontOption[] = [
  ...["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Source Sans 3", "Nunito Sans", "Poppins", "Raleway", "Work Sans", "IBM Plex Sans", "DM Sans", "Public Sans", "Figtree"]
    .map((family): FontOption => ({ family, kind: "google", style: "sans" })),
  ...["Merriweather", "Playfair Display", "Libre Baskerville", "Lora", "Source Serif 4"]
    .map((family): FontOption => ({ family, kind: "google", style: "serif" })),
];

export const FONT_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{0,59}$/;

export function findFont(family: string): FontOption | undefined {
  const f = family.trim().toLowerCase();
  return [...SYSTEM_FONTS, ...GOOGLE_FONTS].find((o) => o.family.toLowerCase() === f);
}

/** The CSS font-family value for a preview. */
export function fontStack(family: string): string {
  if (!family || !FONT_RE.test(family)) return "inherit";
  const serif = findFont(family)?.style === "serif";
  return `"${family}", ${serif ? "Georgia, serif" : "system-ui, sans-serif"}`;
}

/** The Google Fonts stylesheet for a family, or null for system fonts and names that are not safe. */
export function googleFontCssUrl(family: string): string | null {
  if (!family || !FONT_RE.test(family) || findFont(family)?.kind === "system") return null;
  return `https://fonts.googleapis.com/css2?family=${family.trim().replace(/ /g, "+")}:wght@400;700&display=swap`;
}
