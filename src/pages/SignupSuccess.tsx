import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CONTACT_EMAIL } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { getSetupStatus, getSignupStatus, type SetupStatus } from "../lib/api";
import { LAST_SIGNUP_KEY, load } from "../lib/storage";

export const POLL_INTERVAL_MS = 5000;
export const POLL_LIMIT_MS = 120000;
// KS_OPS_AUTO_PROVISION_v1 - once paid, setup progress is polled every 10 seconds for up to 3 hours.
export const SETUP_POLL_MS = 10000;
export const SETUP_POLL_LIMIT_MS = 3 * 60 * 60 * 1000;

/** Statuses that mean payment went through. */
const PAID = new Set(["provisioning", "trial", "active"]);

type Last = { id: string; token: string; company?: string };

export function useSignupRef(params: URLSearchParams): Last | null {
  const id = params.get("l");
  const token = params.get("t");
  if (id && token) return { id, token };
  return load<Last>(LAST_SIGNUP_KEY);
}

/** "We're setting up your system": live progress, then the sign-in button. */
export function SetupProgress({ token, company }: { token: string; company: string }) {
  const [s, setS] = useState<SetupStatus | null>(null);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ac = new AbortController();
    const started = Date.now();
    const tick = async () => {
      try {
        const next = await getSetupStatus(token, ac.signal);
        if (done) return;
        setS(next);
        if (next.state === "ready" || next.state === "not_found") return;
      } catch {
        if (done) return;
      }
      if (Date.now() - started + SETUP_POLL_MS > SETUP_POLL_LIMIT_MS) {
        setStopped(true);
        return;
      }
      timer = setTimeout(tick, SETUP_POLL_MS);
    };
    void tick();
    return () => {
      done = true;
      ac.abort();
      if (timer) clearTimeout(timer);
    };
  }, [token]);

  const name = s?.company_name || company;
  if (s?.state === "ready" && s.portal_url) {
    return (
      <div data-testid="setup-progress">
        <p style={{ marginTop: 0 }}>
          <strong>Your system is ready.</strong> {name ? `${name}'s` : "Your"} Keystone staff portal is up and running.
        </p>
        <p>
          <a className="btn" href={s.portal_url} rel="noopener">
            Sign in to your staff portal
          </a>
        </p>
        <p style={{ marginBottom: 0 }}>
          An email with your sign-in link and company code is on its way. Sign in with your email or mobile number; we'll
          send you a one-time code.
        </p>
      </div>
    );
  }
  if (s?.state === "not_found") return null;
  return (
    <div data-testid="setup-progress">
      <p style={{ marginTop: 0 }}>
        {s?.state === "needs_attention" || stopped ? null : <span className="spinner" aria-hidden="true" />}
        <strong>We're setting up your system{name ? ` for ${name}` : ""}.</strong>{" "}
        {s?.state === "needs_attention" || stopped
          ? "This is taking longer than usual. Our team has been told and will email your sign-in details as soon as it's ready. You can close this page."
          : "This usually takes under an hour. You can keep this page open, or close it: we'll email you when it's ready."}
      </p>
      {s?.steps.length ? (
        <ol className="setup-steps">
          {s.steps.map((st) => (
            <li key={st.label}>
              {st.label}: <strong>{st.status === "done" ? "done" : st.status === "in_progress" ? "in progress" : "waiting"}</strong>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export default function SignupSuccess() {
  usePageMeta("Payment received", "Your sign-up is being processed.");
  const [params] = useSearchParams();
  const ref = useSignupRef(params);
  const setupToken = /^[A-Za-z0-9_-]{43}$/.test(params.get("p") ?? "") ? String(params.get("p")) : "";
  const id = ref?.id ?? "";
  const token = ref?.token ?? "";
  const [status, setStatus] = useState<string>("");
  const [company, setCompany] = useState<string>(ref?.company ?? "");
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    let stopped = false;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ac = new AbortController();
    const tick = async () => {
      try {
        const s = await getSignupStatus(id, token, ac.signal);
        if (stopped) return;
        setStatus(s.status);
        if (s.company_name) setCompany(s.company_name);
        if (PAID.has(s.status)) return;
      } catch {
        if (stopped) return;
      }
      if (Date.now() - started + POLL_INTERVAL_MS > POLL_LIMIT_MS) {
        setGaveUp(true);
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    void tick();
    return () => {
      stopped = true;
      ac.abort();
      if (timer) clearTimeout(timer);
    };
  }, [id, token]);

  const paid = PAID.has(status);

  return (
    <div className="wrap wrap--narrow page-head">
      <h1>{paid ? (setupToken ? "We're setting up your system" : "You're all set") : "Thanks for signing up"}</h1>
      <div className="status-box" role="status" aria-live="polite" data-testid="signup-status">
        {!id || !token ? (
          <p style={{ margin: 0 }}>
            We couldn't find your sign-up details in this link, but if you completed payment you're signed up. Check
            your email for a receipt.
          </p>
        ) : paid && setupToken ? (
          <>
            <p style={{ marginTop: 0 }}>Payment received{company ? ` for ${company}` : ""}.</p>
            <SetupProgress token={setupToken} company={company} />
          </>
        ) : paid ? (
          <p style={{ margin: 0 }}>
            Payment received{company ? ` for ${company}` : ""}. We're setting up your copy now.
          </p>
        ) : gaveUp ? (
          <p style={{ margin: 0 }}>
            We're still waiting for confirmation from the payment provider. This can take a few minutes. You don't need to
            do anything: we'll email you as soon as it's confirmed.
          </p>
        ) : status === "past_due" || status === "cancelled" || status === "suspended" ? (
          <p style={{ margin: 0 }}>
            There's a problem with this sign-up's payment. {CONTACT_EMAIL ? <>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we'll sort it out.</> : "Contact us and we'll sort it out."}
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            <span className="spinner" aria-hidden="true" />
            Confirming your payment{company ? ` for ${company}` : ""}…
          </p>
        )}
      </div>
      <h2>What happens next</h2>
      <ol>
        <li>We set up your brokerage's copy{setupToken ? ", usually within the hour" : " within one business day"}.</li>
        <li>We email your sign-in details to the contact you gave us, with links to the staff portal and apps.</li>
        <li>You sign in, add your lenders and invite your team. Growth and Pro onboarding starts with a call from us.</li>
      </ol>
      <p>
        <Link to="/">Back to the home page</Link>
      </p>
    </div>
  );
}
