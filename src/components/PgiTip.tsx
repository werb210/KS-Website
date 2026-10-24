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
            Personal Guarantee Insurance protects the business owner's personal assets, like their home and savings, if
            the loan they personally guaranteed goes bad.
          </p>
          <p>Your client ticks one box in their application. That's all they do.</p>
          <p>Your brokerage earns a referral commission, paid through {PRODUCT_NAME}.</p>
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
