// KS_WEBSITE_TEAM_ROSTER - the brokerage's team: the owner is person 1 (an Admin, from the contact details), then one
// row per person with their full name, email, mobile and role. Never more people than seats. Used on the sign-up's
// "Your team" step and on /signup/team (the link in the owner's welcome email).
import { Field } from "./Field";
import { EMPTY_MEMBER, TEAM_ROLES, formatNaPhone, type Errors, type TeamMemberForm } from "../lib/validation";

type Props = {
  owner: { name: string; email: string; phone: string };
  team: TeamMemberForm[];
  seats: number;
  errors: Errors;
  onChange: (team: TeamMemberForm[]) => void;
  /** Where to add seats, said when every seat is taken. */
  addSeatsHint?: string;
};

export function TeamRoster({ owner, team, seats, errors, onChange, addSeatsHint = "Add seats on the Plan step to add more people." }: Props) {
  const used = team.length + 1;
  const full = used >= seats;
  const set = (i: number, patch: Partial<TeamMemberForm>) => onChange(team.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const err = (n: number, k: string) => errors[`team.${n}.${k}`];
  return (
    <div data-testid="team-roster">
      <p className="muted">
        Everyone who signs in takes one seat, you included. Each person gets an invite email once your licence agreement is
        signed, and signs in with a code texted to their mobile.
      </p>
      <p className="small" data-testid="team-seats" aria-live="polite">
        {used} of {seats} {seats === 1 ? "seat" : "seats"} used.
      </p>
      {errors.team && (
        <div className="alert alert--error" role="alert">
          {errors.team}
        </div>
      )}
      <fieldset className="field team-person">
        <legend>Person 1: you (Admin)</legend>
        <p className="small" style={{ margin: 0 }} data-testid="team-owner">
          {owner.name || "Your name"}, {owner.email || "your email"}, {formatNaPhone(owner.phone) || owner.phone || "your mobile"}
        </p>
        <span className="hint">From your contact details. Admins can also manage settings, users and billing.</span>
      </fieldset>
      {team.map((m, i) => {
        const n = i + 2;
        return (
          <fieldset className="field team-person" key={n} data-testid={`team-person-${n}`}>
            <legend>Person {n}</legend>
            <div className="row-2">
              <Field id={`team-${n}-full_name`} label={`Person ${n} full name`} error={err(n, "full_name")}>
                {(a) => <input {...a} type="text" autoComplete="off" maxLength={120} value={m.full_name} onChange={(e) => set(i, { full_name: e.target.value })} />}
              </Field>
              <Field id={`team-${n}-email`} label={`Person ${n} email`} error={err(n, "email")}>
                {(a) => <input {...a} type="email" autoComplete="off" maxLength={200} value={m.email} onChange={(e) => set(i, { email: e.target.value })} />}
              </Field>
            </div>
            <div className="row-2">
              <Field id={`team-${n}-phone`} label={`Person ${n} mobile`} hint="Canadian or US mobile. They sign in with a code texted here." error={err(n, "phone")}>
                {(a) => (
                  <input
                    {...a}
                    type="tel"
                    autoComplete="off"
                    placeholder="(403) 555-0123"
                    value={m.phone}
                    onChange={(e) => set(i, { phone: e.target.value })}
                    onBlur={() => set(i, { phone: formatNaPhone(m.phone) || m.phone })}
                  />
                )}
              </Field>
              <Field id={`team-${n}-role`} label={`Person ${n} role`} hint={TEAM_ROLES.find((r) => r.value === m.role)?.detail} error={err(n, "role")}>
                {(a) => (
                  <select {...a} value={m.role} onChange={(e) => set(i, { role: e.target.value as TeamMemberForm["role"] })}>
                    {TEAM_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <button type="button" className="btn btn--quiet" style={{ minHeight: 36, padding: "0.2rem 0.6rem" }} onClick={() => onChange(team.filter((_, j) => j !== i))}>
              Remove person {n}
            </button>
          </fieldset>
        );
      })}
      <p>
        <button type="button" className="btn btn--quiet" disabled={full} onClick={() => onChange([...team, { ...EMPTY_MEMBER }])}>
          Add a person
        </button>
        {full && (
          <span className="small muted" style={{ marginLeft: "0.5rem" }}>
            Every seat is taken. {addSeatsHint}
          </span>
        )}
      </p>
      <p className="small muted">You can skip this and add people later from Settings &gt; Users in your portal.</p>
    </div>
  );
}
