import { useRef, useState } from "react";
import { BrandScanFailed, scanWebsiteBrand, type BrandScanResult } from "../lib/api";
import type { LogoFile, SignupForm } from "../lib/validation";

export type BrandPatch = Partial<Pick<SignupForm, "primary_color" | "accent_color" | "background_color" | "font_family" | "logo_file">>;

type Props = {
  /** The website from the Company step, to start with. */
  website: string;
  form: SignupForm;
  /** Applies the suggestions to the form. */
  apply: (patch: BrandPatch) => void;
  onScanned?: (r: BrandScanResult) => void;
};

const HEX = /^#[0-9a-f]{6}$/i;

export function logoFileFrom(r: BrandScanResult): LogoFile | null {
  const l = r.logo;
  if (!l || !["image/png", "image/jpeg", "image/svg+xml"].includes(l.content_type) || !l.data_base64) return null;
  const size = Math.floor((l.data_base64.replace(/=+$/, "").length * 3) / 4);
  return { name: (l.filename || "logo").slice(0, 150), type: l.content_type, size, data_url: `data:${l.content_type};base64,${l.data_base64}` };
}

/** The suggestions as a form patch. A logo the person uploaded themselves is kept. */
export function patchFrom(r: BrandScanResult, form: SignupForm): BrandPatch {
  const s = r.suggestions;
  const patch: BrandPatch = {};
  if (s.primary_color && HEX.test(s.primary_color)) patch.primary_color = s.primary_color.toLowerCase();
  if (s.accent_color && HEX.test(s.accent_color)) patch.accent_color = s.accent_color.toLowerCase();
  if (s.background_color && HEX.test(s.background_color)) patch.background_color = s.background_color.toLowerCase();
  if (s.font?.family) patch.font_family = s.font.family;
  const logo = logoFileFrom(r);
  if (logo && !form.logo_file) patch.logo_file = logo;
  return patch;
}

/** "Use my website": reads the brokerage's site (through KS-Ops) and pre-fills the branding fields. */
export function BrandFromWebsite({ website, form, apply, onScanned }: Props) {
  const [url, setUrl] = useState(website);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState<BrandScanResult | null>(null);
  const [filled, setFilled] = useState<string[]>([]);
  const before = useRef<BrandPatch | null>(null);

  async function scan() {
    setProblem("");
    setResult(null);
    setFilled([]);
    if (!url.trim()) {
      setProblem("Enter your website address, like prairiecapital.ca.");
      return;
    }
    setBusy(true);
    try {
      const r = await scanWebsiteBrand(url.trim());
      const patch = patchFrom(r, form);
      before.current = Object.fromEntries(Object.keys(patch).map((k) => [k, form[k as keyof BrandPatch]])) as BrandPatch;
      apply(patch);
      setResult(r);
      onScanned?.(r);
      const names: string[] = [];
      if (patch.logo_file) names.push("logo");
      if (patch.primary_color) names.push("main colour");
      if (patch.accent_color) names.push("accent colour");
      if (patch.background_color) names.push("background colour");
      if (patch.font_family) names.push(`font (${patch.font_family})`);
      setFilled(names);
    } catch (err) {
      setProblem(err instanceof BrandScanFailed ? err.message : "We couldn't read that website. You can fill in your branding yourself.");
    } finally {
      setBusy(false);
    }
  }

  const otherLogo = result && form.logo_file && result.logo && !filled.includes("logo") ? logoFileFrom(result) : null;

  return (
    <div className="brand-scan" aria-labelledby="brand-scan-h">
      <h3 id="brand-scan-h" className="brand-scan__title">
        Use my website
      </h3>
      <p className="small" style={{ marginTop: 0 }}>
        We can read your logo, colours and font from your website and fill them in below. You can change anything after.
      </p>
      <div className="brand-scan__row">
        <label htmlFor="brand_scan_url" className="visually-hidden">
          Your website address
        </label>
        <input
          id="brand_scan_url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="yourbrokerage.ca"
          value={url}
          maxLength={500}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void scan();
            }
          }}
          aria-describedby={problem ? "brand_scan-error" : undefined}
        />
        <button type="button" className="btn btn--quiet" onClick={() => void scan()} disabled={busy}>
          {busy ? "Reading your website…" : "Use my website"}
        </button>
      </div>
      <div aria-live="polite">
        {problem && (
          <p className="field-error" id="brand_scan-error" role="alert">
            {problem}
          </p>
        )}
        {result && (
          <div className="brand-scan__done" data-testid="brand-scan-result">
            {filled.length ? (
              <p className="field-ok" style={{ margin: 0 }}>
                Filled in from {result.site_name || result.url}: {filled.join(", ")}. Check them below.
              </p>
            ) : (
              <p className="small" style={{ margin: 0 }}>
                We read {result.url} but didn't find a logo, colours or font we could use. Fill them in below.
              </p>
            )}
            <p className="small" style={{ margin: "0.4rem 0 0" }}>
              {otherLogo && (
                <button type="button" className="btn btn--quiet btn--small" onClick={() => apply({ logo_file: otherLogo })}>
                  Use the logo from my website instead
                </button>
              )}{" "}
              {filled.length > 0 && (
                <button
                  type="button"
                  className="btn btn--quiet btn--small"
                  onClick={() => {
                    if (before.current) apply(before.current);
                    setFilled([]);
                    setResult(null);
                  }}
                >
                  Undo
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
