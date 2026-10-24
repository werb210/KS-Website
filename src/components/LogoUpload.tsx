import { useRef, useState } from "react";
import { LOGO_TYPES, MAX_LOGO_BYTES, type LogoFile } from "../lib/validation";

type Props = { value: LogoFile | null; onChange: (v: LogoFile | null) => void; error?: string };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

/** Logo upload: PNG, JPG or SVG up to 500 KB, with a preview on light and dark backgrounds. */
export function LogoUpload({ value, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState("");
  const shown = problem || error;

  async function pick(file: File | undefined) {
    setProblem("");
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setProblem("Use a PNG, JPG or SVG file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setProblem(`That file is ${Math.ceil(file.size / 1024)} KB. Use a logo under 500 KB.`);
      return;
    }
    try {
      onChange({ name: file.name.slice(0, 150), type: file.type, size: file.size, data_url: await readAsDataUrl(file) });
    } catch {
      setProblem("We couldn't read that file. Try another.");
    }
  }

  return (
    <div className="field">
      <label htmlFor="logo_file">Logo (optional)</label>
      <span className="hint" id="logo_file-hint">
        PNG, JPG or SVG, up to 500 KB. A wide logo on a transparent background works best. You can also email it to us later.
      </span>
      <input
        ref={input}
        id="logo_file"
        type="file"
        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
        aria-describedby={`logo_file-hint${shown ? " logo_file-error" : ""}`}
        aria-invalid={Boolean(shown)}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {value && (
        <div className="logo-preview" data-testid="logo-preview">
          <div className="logo-preview__tiles">
            <span className="logo-preview__tile">
              <img src={value.data_url} alt={`Your logo (${value.name})`} />
            </span>
            <span className="logo-preview__tile logo-preview__tile--dark" aria-hidden="true">
              <img src={value.data_url} alt="" />
            </span>
          </div>
          <p className="small" style={{ margin: "0.4rem 0 0" }}>
            {value.name}, {Math.max(1, Math.round(value.size / 1024))} KB.{" "}
            <button
              type="button"
              className="btn btn--quiet btn--small"
              onClick={() => {
                onChange(null);
                if (input.current) input.current.value = "";
              }}
            >
              Remove logo
            </button>
          </p>
        </div>
      )}
      {shown && (
        <span className="field-error" id="logo_file-error" role="alert">
          {shown}
        </span>
      )}
    </div>
  );
}
