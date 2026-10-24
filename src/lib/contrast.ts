// WCAG 2.x relative luminance and contrast ratio.

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(rgb: [number, number, number]): number {
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number | null {
  const ra = parseHex(a);
  const rb = parseHex(b);
  if (!ra || !rb) return null;
  const la = luminance(ra);
  const lb = luminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Darken a colour step by step until white text on it reaches the target ratio. */
export function darkenForWhiteText(hex: string, target = 4.5): string | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  let [r, g, b] = rgb;
  for (let i = 0; i < 100; i++) {
    const out = toHex([r, g, b]);
    const ratio = contrastRatio(out, "#ffffff");
    if (ratio !== null && ratio >= target) return out;
    r = Math.floor(r * 0.95);
    g = Math.floor(g * 0.95);
    b = Math.floor(b * 0.95);
  }
  return "#000000";
}

export function toHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** Text colour used on a licensee's background / surface colour. */
export const DARK_TEXT = "#16263a";

/** Lighten a colour step by step (towards white) until dark text on it reaches the target ratio. */
export function lightenForDarkText(hex: string, target = 4.5, text = DARK_TEXT): string | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  let [r, g, b] = rgb;
  for (let i = 0; i < 100; i++) {
    const out = toHex([r, g, b]);
    const ratio = contrastRatio(out, text);
    if (ratio !== null && ratio >= target) return out;
    r = Math.min(255, Math.ceil(r + (255 - r) * 0.08));
    g = Math.min(255, Math.ceil(g + (255 - g) * 0.08));
    b = Math.min(255, Math.ceil(b + (255 - b) * 0.08));
  }
  return "#ffffff";
}
