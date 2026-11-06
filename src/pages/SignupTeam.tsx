// KS_WEBSITE_TEAM_ROSTER - /signup/team?l=<sign-up>&t=<token>: the link in the owner's welcome email, to change the team
// before it is invited. Once the team is invited, changes are made in the portal (Settings > Users).
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TeamRoster } from "../components/TeamRoster";
import { usePageMeta } from "../hooks/usePageMeta";
import { getTeam, saveTeam, type TeamState } from "../lib/api";
import { e164NaPhone, formatNaPhone, teamErrors, type Errors, type TeamMemberForm, type TeamRole } from "../lib/validation";
import { useSignupRef } from "./SignupSuccess";

const asRole = (r: string): TeamRole => (r === "Marketing" || r === "Admin" ? r : "Broker");

export default function SignupTeam() {
  usePageMeta("Your team", "Review who on your team gets a Keystone invite.");
  const [params] = useSearchParams();
  const ref = useSignupRef(params);
  const [state, setState] = useState<TeamState | null>(null);
  const [failed, setFailed] = useState(false);
  const [team, setTeam] = useState<TeamMemberForm[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const ac = new AbortController();
    void getTeam(ref.id, ref.token, ac.signal).then((t) => {
      if (ac.signal.aborted) return;
      if (!t) return setFailed(true);
      setState(t);
      setTeam(t.team.filter((m) => !m.is_owner).map((m) => ({ full_name: m.full_name, email: m.email, phone: formatNaPhone(m.phone) || m.phone, role: asRole(m.role) })));
    });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [ref?.id, ref?.token]);

  const owner = state?.team.find((m) => m.is_owner);

  async function save() {
    if (!ref || !state || !owner) return;
    const e = teamErrors(team, { email: owner.email, phone: owner.phone }, state.seats);
    setErrors(e);
    setSaved(false);
    if (Object.keys(e).length) return;
    setBusy(true);
    setAlert("");
    const r = await saveTeam(ref.id, ref.token, team.map((m) => ({ full_name: m.full_name.trim(), email: m.email.trim(), phone: e164NaPhone(m.phone) || m.phone, role: m.role })));
    setBusy(false);
    if (r.ok) {
      setState(r.team);
      setSaved(true);
      return;
    }
    setErrors(r.errors);
    setAlert(r.message);
    if (r.status === 409) setState({ ...state, locked: true });
  }

  if (!ref || failed) {
    return (
      <div className="wrap wrap--narrow page-head">
        <h1>Your team</h1>
        <p>We couldn't open your team from this link. Open the link from your email again, or <Link to="/contact">contact us</Link>.</p>
      </div>
    );
  }
  if (!state || !owner) return <div className="wrap wrap--narrow page-head"><p role="status">Loading your team…</p></div>;
  return (
    <div className="wrap wrap--narrow page-head">
      <h1>Your team{state.company_name ? ` at ${state.company_name}` : ""}</h1>
      {state.locked ? (
        <div className="status-box" role="status" data-testid="team-locked">
          <p style={{ marginBottom: 0 }}>Your team has already been invited. Add or change people from Settings &gt; Users in your portal.</p>
        </div>
      ) : (
        <>
          {alert && (
            <div className="alert alert--error" role="alert">
              {alert}
            </div>
          )}
          <TeamRoster
            owner={{ name: owner.full_name, email: owner.email, phone: formatNaPhone(owner.phone) || owner.phone }}
            team={team}
            seats={state.seats}
            errors={errors}
            onChange={(t) => { setTeam(t); setSaved(false); setErrors({}); }}
            addSeatsHint="To add seats, reply to your welcome email or add them in your portal later."
          />
          <div className="form-actions">
            <span>{saved && <span className="field-ok" role="status">Saved. Everyone on the list is invited once your system is ready.</span>}</span>
            <button type="button" className="btn" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save team"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
