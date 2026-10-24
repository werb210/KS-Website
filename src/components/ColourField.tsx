import { DARK_TEXT, contrastRatio, darkenForWhiteText, lightenForDarkText } from "../lib/contrast";

type Props = {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  /** "white-text": white text sits on this colour (buttons, headers). "dark-text": dark text sits on it (backgrounds). */
  mode: "white-text" | "dark-text";
  /** The swatch shown in the picker while the field is empty. */
  fallback: string;
  /** Empty is allowed (the default is used). */
  optional?: boolean;
};

const HEX = /^#[0-9a-f]{6}$/i;

/** A brand colour: picker, hex box, a live sample, and the automatic contrast check with a one-click fix. */
export function ColourField({ id, label, hint, value, onChange, error, mode, fallback, optional }: Props) {
  const textColour = mode === "white-text" ? "#ffffff" : DARK_TEXT;
  const valid = HEX.test(value);
  const ratio = valid ? contrastRatio(value, textColour) : null;
  const fixed = ratio !== null && ratio < 4.5 ? (mode === "white-text" ? darkenForWhiteText(value) : lightenForDarkText(value)) : null;
  const what = mode === "white-text" ? "white text" : "dark text";
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <span className="hint" id={`${id}-hint`}>
        {hint}
      </span>
      <div className="swatch-row">
        <input
          type="color"
          aria-label={`Pick the ${label.toLowerCase()}`}
          value={valid ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          id={id}
          type="text"
          style={{ maxWidth: "9rem" }}
          placeholder={optional ? "Default" : fallback}
          aria-describedby={`${id}-hint ${id}-check${error ? ` ${id}-error` : ""}`}
          aria-invalid={Boolean(error)}
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
        />
        {valid && (
          <span className="swatch-preview" style={{ background: value, color: textColour }} aria-hidden="true">
            {mode === "white-text" ? "Apply now" : "Sample text"}
          </span>
        )}
        {optional && value && (
          <button type="button" className="btn btn--quiet btn--small" onClick={() => onChange("")}>
            Use the default
          </button>
        )}
      </div>
      <span id={`${id}-check`} aria-live="polite">
        {ratio !== null &&
          (ratio >= 4.5 ? (
            <span className="field-ok">
              Contrast with {what}: {ratio.toFixed(1)} to 1. Easy to read.
            </span>
          ) : (
            <span className="field-error">
              Contrast with {what}: {ratio.toFixed(1)} to 1. Too {mode === "white-text" ? "light" : "dark"} for {what}.{" "}
              {fixed && (
                <button type="button" className="btn btn--quiet btn--small" style={{ marginTop: "0.4rem" }} onClick={() => onChange(fixed)}>
                  Use {fixed} instead
                </button>
              )}
            </span>
          ))}
      </span>
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
