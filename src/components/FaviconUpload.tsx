import { useRef, useState } from "react";
import { FAVICON_TYPES, MAX_LOGO_BYTES, type LogoFile } from "../lib/validation";

type Props = { value: LogoFile | null; onChange: (v: LogoFile | null) => void; error?: string };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

/** KS_WEBSITE_SIGNUP_FAVICON_v1 - favicon upload: PNG, SVG or ICO up to 500 KB, shown at tab size. */
export function FaviconUpload({ value, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState("");
  const shown = problem || error;

  async function pick(file: File | undefined) {
    setProblem("");
    if (!file) return;
    if (!FAVICON_TYPES.includes(file.type) && !/\.ico$/i.test(file.name)) {
      setProblem("Use a PNG, SVG or ICO file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setProblem(`That file is ${Math.ceil(file.size / 1024)} KB. Use a favicon under 500 KB.`);
      return;
    }
    try {
      onChange({ name: file.name.slice(0, 150), type: file.type || "image/x-icon", size: file.size, data_url: await readAsDataUrl(file) });
    } catch {
      setProblem("We couldn't read that file. Try another.");
    }
  }

  return (
    <div className="field">
      <label htmlFor="favicon_file">Favicon (optional)</label>
      <span className="hint" id="favicon_file-hint">
        The small icon in the browser tab. A square PNG (512 x 512), SVG or ICO, up to 500 KB.
      </span>
      <input
        ref={input}
        id="favicon_file"
        type="file"
        accept=".png,.svg,.ico,image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
        aria-describedby={`favicon_file-hint${shown ? " favicon_file-error" : ""}`}
        aria-invalid={Boolean(shown)}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {value && (
        <div className="logo-preview" data-testid="favicon-preview">
          <div className="logo-preview__tiles">
            <span className="logo-preview__tile">
              <img src={value.data_url} alt={`Your favicon (${value.name})`} style={{ width: 32, height: 32 }} />
            </span>
            <span className="logo-preview__tile logo-preview__tile--dark" aria-hidden="true">
              <img src={value.data_url} alt="" style={{ width: 32, height: 32 }} />
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
              Remove favicon
            </button>
          </p>
        </div>
      )}
      {shown && (
        <span className="field-error" id="favicon_file-error" role="alert">
          {shown}
        </span>
      )}
    </div>
  );
}
