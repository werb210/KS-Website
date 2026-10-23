import { useEffect, useState, type ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  hint?: ReactNode;
  error?: string;
  /** Spoken names for the buttons, e.g. "Remove a seat" / "Add a seat". */
  decLabel: string;
  incLabel: string;
  /** Text after the box, e.g. "seats". */
  unit?: string;
  compact?: boolean;
};

/**
 * A number with - and + buttons. Typing is free while the box has focus; leaving it snaps the number into [min, max],
 * so an empty or out-of-range entry never sticks.
 */
export function NumberStepper({ id, label, value, min, max, onChange, hint, error, decLabel, incLabel, unit, compact }: Props) {
  const [text, setText] = useState(Number.isFinite(value) ? String(value) : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(Number.isFinite(value) ? String(value) : "");
  }, [value, focused]);

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(n)));
  const current = Number.isFinite(value) ? value : min;
  const step = (d: number) => onChange(clamp(current + d));

  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field stepper-field${compact ? " stepper-field--compact" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {hint && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
      <div className="stepper">
        <button
          type="button"
          className="stepper__btn"
          aria-label={decLabel}
          aria-controls={id}
          disabled={current <= min}
          onClick={() => step(-1)}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={focused ? text : Number.isFinite(value) ? value : ""}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onFocus={() => {
            setFocused(true);
            setText(Number.isFinite(value) ? String(value) : "");
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = e.target.value === "" ? NaN : Math.floor(Number(e.target.value));
            onChange(n);
          }}
          onBlur={() => {
            setFocused(false);
            const n = Number(text);
            onChange(text.trim() === "" || !Number.isFinite(n) ? min : clamp(n));
          }}
        />
        <button
          type="button"
          className="stepper__btn"
          aria-label={incLabel}
          aria-controls={id}
          disabled={current >= max}
          onClick={() => step(1)}
        >
          <span aria-hidden="true">+</span>
        </button>
        {unit && (
          <span className="stepper__unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      {error && (
        <span className="field-error" id={errId}>
          {error}
        </span>
      )}
    </div>
  );
}
