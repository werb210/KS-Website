import type { ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
  status?: ReactNode;
};

/** Label + hint + inline error wired up with aria-describedby. */
export function Field({ id, label, hint, error, children, status }: Props) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const statusId = status ? `${id}-status` : undefined;
  const describedBy = [hintId, errId, statusId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {status && (
        <span id={statusId} aria-live="polite">
          {status}
        </span>
      )}
      {error && (
        <span className="field-error" id={errId}>
          {error}
        </span>
      )}
    </div>
  );
}
