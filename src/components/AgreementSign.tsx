// KS_WEBSITE_LICENCE_AGREEMENT - the Keystone Software Licence Agreement for one sign-up, rendered by KS-Ops with the
// brokerage's plan, seats, add-ons, support level and price. The owner types their full name and title and ticks
// "I agree"; KS-Ops records the signature (with a fingerprint of the exact text shown) and emails a copy.
// Used as the sign-up's last step (before payment) and on /signup/agreement (the link in the owner's email).
import { useEffect, useState, type FormEvent } from "react";
import { Field } from "./Field";
import { getAgreement, signAgreement, type Agreement, type AgreementSignature } from "../lib/api";
import { cleanArticleHtml } from "../lib/safeHtml";

type Props = {
  licenseeId: string;
  token: string;
  /** Called once signed (or if it was already signed). */
  onSigned: (s: AgreementSignature) => void;
  /** Called when the agreement cannot be loaded at all. */
  onUnavailable?: () => void;
  submitLabel?: string;
};

export function AgreementSign({ licenseeId, token, onSigned, onUnavailable, submitLabel = "Sign and continue" }: Props) {
  const [doc, setDoc] = useState<Agreement | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    void getAgreement(licenseeId, token, ac.signal).then((a) => {
      if (ac.signal.aborted) return;
      if (!a) {
        setState("failed");
        onUnavailable?.();
        return;
      }
      setDoc(a);
      setState("ready");
      setName((n) => n || a.contact_name || "");
      setTitle((t) => t || a.contact_title || "");
      if (a.signed) onSigned(a.signed);
    });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per sign-up (and after the text changed)
  }, [licenseeId, token, reload]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!doc) return;
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.signer_name = "Type your full name.";
    if (title.trim().length < 2) e.signer_title = "Type your title, for example Owner or President.";
    if (!agree) e.agree = "Tick the box to agree.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setAlert("");
    const r = await signAgreement(licenseeId, token, { signer_name: name.trim(), signer_title: title.trim(), sha256: doc.sha256 });
    setBusy(false);
    if (r.ok) {
      onSigned(r.signed);
      return;
    }
    setErrors(r.errors);
    setAlert(r.message);
    if (r.changed) {
      setAgree(false);
      setReload((n) => n + 1);
    }
  }

  if (state === "loading") return <p role="status">Loading your licence agreement…</p>;
  if (state === "failed" || !doc) {
    return (
      <div className="alert alert--error" role="alert">
        We couldn't load your licence agreement. We'll email you a link to sign it.
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Licence agreement" data-testid="agreement-form">
      <p className="muted">
        Please read the agreement for {doc.legal_name}. It covers your licence, fees, your data and support. Signing takes a
        moment: type your name and title and tick the box.
      </p>
      <div
        className="agreement-text"
        tabIndex={0}
        role="region"
        aria-label={doc.title}
        data-testid="agreement-text"
        dangerouslySetInnerHTML={{ __html: cleanArticleHtml(doc.html) }}
      />
      {alert && (
        <div className="alert alert--error" role="alert">
          {alert}
        </div>
      )}
      <div className="row-2">
        <Field id="signer_name" label="Your full name" error={errors.signer_name}>
          {(a) => <input {...a} type="text" autoComplete="name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field id="signer_title" label="Your title" hint="For example Owner, President or Managing Partner." error={errors.signer_title}>
          {(a) => <input {...a} type="text" autoComplete="organization-title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />}
        </Field>
      </div>
      <div className="check">
        <input
          id="agree"
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          aria-invalid={Boolean(errors.agree)}
          aria-describedby={errors.agree ? "agree-error" : undefined}
        />
        <label htmlFor="agree">
          I agree to the {doc.title} on behalf of {doc.legal_name}, and I am authorized to sign for it.
        </label>
      </div>
      {errors.agree && (
        <span className="field-error" id="agree-error" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
          {errors.agree}
        </span>
      )}
      <p className="small muted">Version {doc.version}. A signed copy is emailed to you.</p>
      <div className="form-actions">
        <span />
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Signing…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
