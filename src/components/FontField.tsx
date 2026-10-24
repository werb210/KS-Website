import { useEffect } from "react";
import { GOOGLE_FONTS, SYSTEM_FONTS, findFont, fontStack, googleFontCssUrl } from "../lib/fonts";

type Props = {
  value: string;
  onChange: (v: string) => void;
  /** The font read from the brokerage's website, when "Use my website" found one. */
  websiteFont?: { family: string; source: "google" | "self_hosted" | "system" } | null;
  error?: string;
};

/** Loads a Google font for the preview (once per family). */
function usePreviewFont(family: string) {
  useEffect(() => {
    const href = googleFontCssUrl(family);
    if (!href || document.querySelector(`link[data-font-preview="${CSS.escape(family)}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.fontPreview = family;
    document.head.appendChild(link);
  }, [family]);
}

/** The font for the brokerage's client app and pages: web-safe fonts, Google fonts, or the website's own. */
export function FontField({ value, onChange, websiteFont, error }: Props) {
  usePreviewFont(value);
  const site = websiteFont && !findFont(websiteFont.family) ? websiteFont : null;
  const custom = value && !findFont(value) && value !== site?.family ? value : null;
  return (
    <div className="field">
      <label htmlFor="font_family">Font (optional)</label>
      <span className="hint" id="font_family-hint">
        Used for the text in your client app and pages. Leave it on the default for a clean, standard font.
      </span>
      <select
        id="font_family"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`font_family-hint font_family-sample${error ? " font_family-error" : ""}`}
        aria-invalid={Boolean(error)}
      >
        <option value="">Default</option>
        {(site || custom) && (
          <optgroup label="From your website">
            {site && <option value={site.family}>Use my website's font ({site.family})</option>}
            {custom && <option value={custom}>{custom}</option>}
          </optgroup>
        )}
        {websiteFont && findFont(websiteFont.family) && (
          <optgroup label="From your website">
            <option value={findFont(websiteFont.family)!.family}>Use my website's font ({findFont(websiteFont.family)!.family})</option>
          </optgroup>
        )}
        <optgroup label="On every device">
          {SYSTEM_FONTS.map((f) => (
            <option key={f.family} value={f.family}>
              {f.family}
            </option>
          ))}
        </optgroup>
        <optgroup label="Google Fonts">
          {GOOGLE_FONTS.map((f) => (
            <option key={f.family} value={f.family}>
              {f.family}
            </option>
          ))}
        </optgroup>
      </select>
      <p className="font-sample" id="font_family-sample" style={{ fontFamily: fontStack(value) }}>
        Your application is in review. We'll let you know what comes next.
      </p>
      {value && site?.family === value && site.source === "self_hosted" && (
        <span className="hint">
          This font comes from your own website, not Google Fonts. Devices that don't have it show a similar standard
          font instead.
        </span>
      )}
      {error && (
        <span className="field-error" id="font_family-error">
          {error}
        </span>
      )}
    </div>
  );
}
