import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CONTACT_EMAIL } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { resumeCheckout } from "../lib/api";
import { goTo } from "../lib/navigate";
import { useSignupRef } from "./SignupSuccess";

export default function SignupCancelled() {
  usePageMeta("Payment not completed", "Your payment wasn't completed. Resume when you're ready.");
  const [params] = useSearchParams();
  const ref = useSignupRef(params);
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");

  async function resume() {
    if (!ref) return;
    setState("working");
    const url = await resumeCheckout(ref.id, ref.token);
    if (url) goTo(url);
    else setState("failed");
  }

  return (
    <div className="wrap wrap--narrow page-head">
      <h1>Payment not completed</h1>
      <p>No payment was taken. Your sign-up details are saved, so you can pick up where you left off.</p>
      {ref ? (
        <p>
          <button type="button" className="btn" onClick={resume} disabled={state === "working"}>
            {state === "working" ? "Opening payment…" : "Resume payment"}
          </button>
        </p>
      ) : (
        <p>
          <Link className="btn" to="/signup">
            Start sign-up again
          </Link>
        </p>
      )}
      {state === "failed" && (
        <div className="alert alert--error" role="alert">
          We couldn't open the payment page.{" "}
          {CONTACT_EMAIL ? (
            <>
              Email <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Finish my sign-up payment")}`}>{CONTACT_EMAIL}</a> and we'll send you a payment link.
            </>
          ) : (
            <>
              <Link to="/contact">Contact us</Link> and we'll send you a payment link.
            </>
          )}
        </div>
      )}
      <p className="muted">
        Changed your mind about the plan? <Link to="/contact">Tell us</Link> and we'll update it before you pay.
      </p>
    </div>
  );
}
