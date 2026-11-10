// KS_WEBSITE_LICENCE_AGREEMENT - /signup/agreement?l=<sign-up>&t=<token>: the link in the owner's emails, to sign the
// Keystone Software Licence Agreement after payment. The team is invited as soon as it is signed.
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AgreementSign } from "../components/AgreementSign";
import { usePageMeta } from "../hooks/usePageMeta";
import type { AgreementSignature } from "../lib/api";
import { useSignupRef } from "./SignupSuccess";

export default function SignupAgreement() {
  usePageMeta("Licence agreement", "Review and sign your Keystone Software Licence Agreement.");
  const [params] = useSearchParams();
  const ref = useSignupRef(params);
  const [signed, setSigned] = useState<AgreementSignature | null>(null);

  if (!ref) {
    return (
      <div className="wrap wrap--narrow page-head">
        <h1>Licence agreement</h1>
        <p>This link is missing part of its address. Open the link from your email again, or <Link to="/contact">contact us</Link>.</p>
      </div>
    );
  }
  return (
    <div className="wrap wrap--narrow page-head">
      <h1>Your licence agreement</h1>
      {signed ? (
        <div className="status-box" role="status" data-testid="agreement-signed">
          <p>
            Signed by <strong>{signed.signer_name}</strong> ({signed.signer_title}) on{" "}
            {new Date(signed.signed_at).toLocaleDateString("en-CA", { dateStyle: "long" })}. A signed copy is in your email.
          </p>
          <p style={{ marginBottom: 0 }}>
            Your team is invited as soon as your system is ready. Need to change who is on it? <Link to={`/signup/team?l=${encodeURIComponent(ref.id)}&t=${encodeURIComponent(ref.token)}`}>Review your team</Link>.
          </p>
        </div>
      ) : (
        <AgreementSign licenseeId={ref.id} token={ref.token} onSigned={setSigned} submitLabel="Sign" />
      )}
    </div>
  );
}
