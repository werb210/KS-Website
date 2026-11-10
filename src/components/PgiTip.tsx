import { useEffect, useId, useRef, useState } from "react";
import { PRODUCT_NAME } from "../config";

/**
 * "What is PGI?" - a small explainer that opens under its button. Keyboard friendly: Enter or Space opens it and moves
 * focus into it, Esc or the close button shuts it and puts focus back on the button, and a click outside closes it.
 */
export function PgiTip({ label = "What is PGI?" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelId = `pgi-tip-${id}`;
  const titleId = `${panelId}-title`;
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <span className="tip">
      <button
        ref={button}
        type="button"
        className="tip__button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div
          ref={panel}
          id={panelId}
          className="tip__panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onBlur={(e) => {
            if (!panel.current?.contains(e.relatedTarget as Node | null) && e.relatedTarget !== button.current) setOpen(false);
          }}
        >
          <h3 id={titleId}>What is PGI?</h3>
          <p>
            {/* KS_WEBSITE_PGI_REFERRAL_FEE_v1 */}
            Personal Guarantee Insurance can pay a business owner part of their loss if the personal guarantee they
            signed on a business loan is enforced, subject to the policy terms. It doesn't cover the whole loan.
          </p>
          <p>Your client ticks one box in their application. Our insurance partner handles the rest; you don't give insurance advice.</p>
          <p>
            Where permitted, your brokerage earns a flat referral fee for each qualified referral, paid through {PRODUCT_NAME},
            whether or not a policy is bound.
          </p>
          <button
            ref={close}
            type="button"
            className="tip__close"
            aria-label="Close"
            onClick={() => {
              setOpen(false);
              button.current?.focus();
            }}
          >
            ×
          </button>
        </div>
      )}
    </span>
  );
}
