import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { SCREEN_ALT, screenSources, type ScreenName } from "../lib/screens";

export type GalleryItem = {
  name: ScreenName;
  caption: string;
  /** How wide the thumbnail shows, for the browser's choice between 1x and 2x. */
  sizes?: string;
};

type Props = {
  items: GalleryItem[];
  /** Layout: "grid" is 3 across on a desktop, 2 on a tablet and 1 on a phone. The others keep a page's own layout. */
  layout?: "grid" | "pair" | "phones" | "single";
  /** Screen-reader name for the group, e.g. "Staff portal screenshots". */
  label: string;
};

const LAYOUT_CLASS: Record<NonNullable<Props["layout"]>, string> = {
  grid: "gallery gallery--grid",
  pair: "gallery shots-pair",
  phones: "gallery shots-phones",
  single: "gallery gallery--single",
};

/**
 * Screenshots as thumbnails. Each one opens full size in a lightbox: Esc closes, the arrow keys or a swipe move
 * between images, focus stays inside while it is open and goes back to the thumbnail when it closes.
 */
export function ScreenGallery({ items, layout = "grid", label }: Props) {
  const shown = items.filter((i) => screenSources(i.name));
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const lastOpened = useRef<number | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (open === null && lastOpened.current !== null) {
      triggers.current[lastOpened.current]?.focus();
      lastOpened.current = null;
    }
  }, [open]);

  return (
    <>
      <ul className={LAYOUT_CLASS[layout]} aria-label={label}>
        {shown.map((item, i) => {
          const s = screenSources(item.name)!;
          return (
            <li key={item.name} className={`gallery__item shot shot--${s.frame}`}>
              <figure className="gallery__figure">
                <button
                  type="button"
                  className="gallery__thumb"
                  ref={(el) => {
                    triggers.current[i] = el;
                  }}
                  onClick={() => {
                    lastOpened.current = i;
                    setOpen(i);
                  }}
                  aria-haspopup="dialog"
                >
                  <picture>
                    <source type="image/avif" srcSet={s.avif} sizes={item.sizes ?? `${s.width}px`} />
                    <source type="image/webp" srcSet={s.webp} sizes={item.sizes ?? `${s.width}px`} />
                    <img
                      src={s.png}
                      width={s.width}
                      height={s.height}
                      alt={SCREEN_ALT[item.name]}
                      loading="lazy"
                      decoding="async"
                      className="shot__img"
                    />
                  </picture>
                  <span className="gallery__zoom" aria-hidden="true">
                    View larger
                  </span>
                  <span className="visually-hidden">: open full size</span>
                </button>
                <figcaption>{item.caption}</figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
      {open !== null && <Lightbox items={shown} index={open} onIndex={setOpen} onClose={close} />}
    </>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const titleId = useId();
  const item = items[index];
  const s = screenSources(item.name)!;
  const many = items.length > 1;
  const go = useCallback((step: number) => onIndex((index + step + items.length) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    closeBtn.current?.focus();
    const body = document.body;
    const before = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = before;
    };
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (many && e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (many && e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function onTouchStart(e: TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: TouchEvent) {
    const start = touchX.current;
    touchX.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (!many || start == null || end == null) return;
    const dx = end - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  }

  return (
    <div className="lightbox" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialog}
        className="lightbox__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="lightbox__bar">
          <p className="lightbox__count" aria-live="polite">
            {many ? `Image ${index + 1} of ${items.length}` : "Screenshot"}
          </p>
          <button ref={closeBtn} type="button" className="lightbox__btn" onClick={onClose}>
            Close<span className="visually-hidden"> (Esc)</span>
          </button>
        </div>
        <figure className={`lightbox__figure lightbox__figure--${s.frame}`}>
          <picture key={item.name}>
            <source type="image/avif" srcSet={s.avif} sizes={`min(94vw, ${s.width * 2}px)`} />
            <source type="image/webp" srcSet={s.webp} sizes={`min(94vw, ${s.width * 2}px)`} />
            <img src={s.png} width={s.width} height={s.height} alt={SCREEN_ALT[item.name]} decoding="async" className="lightbox__img" />
          </picture>
          <figcaption id={titleId}>{item.caption}</figcaption>
        </figure>
        {many && (
          <div className="lightbox__nav">
            <button type="button" className="lightbox__btn" onClick={() => go(-1)}>
              <span aria-hidden="true">←</span> Previous
            </button>
            <button type="button" className="lightbox__btn" onClick={() => go(1)}>
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
