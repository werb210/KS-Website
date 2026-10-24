import type { ReactNode } from "react";
import { nativeScreen, SCREEN_ALT, screenSources, type NativeSlot, type ScreenName } from "../lib/screens";

type Props = {
  name: ScreenName;
  /** How wide the image shows on the page, for the browser's choice between 1x and 2x. */
  sizes?: string;
  caption?: ReactNode;
  /** Above the fold: load now instead of lazily. */
  eager?: boolean;
  className?: string;
};

/** A real screenshot in its device frame (avif, then webp, then PNG), lazy-loaded, with its size reserved. */
export function Screenshot({ name, sizes, caption, eager = false, className }: Props) {
  const s = screenSources(name);
  if (!s) return null;
  const img = (
    <picture>
      <source type="image/avif" srcSet={s.avif} sizes={sizes ?? `${s.width}px`} />
      <source type="image/webp" srcSet={s.webp} sizes={sizes ?? `${s.width}px`} />
      <img
        src={s.png}
        width={s.width}
        height={s.height}
        alt={SCREEN_ALT[name]}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="shot__img"
      />
    </picture>
  );
  return (
    <figure className={`shot shot--${s.frame}${className ? ` ${className}` : ""}`}>
      {img}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * A native app screen (iPhone dialler, Apple Watch). Shows the screenshot from src/assets/screens/native/ when one has
 * been added, otherwise the drawing passed as children.
 */
export function NativeScreen({ slot, alt, caption, children }: { slot: NativeSlot; alt: string; caption?: ReactNode; children: ReactNode }) {
  const src = nativeScreen(slot);
  if (!src) return <>{children}</>;
  return (
    <figure className={`shot shot--native shot--${slot}`} data-native-slot={slot}>
      <img src={src} alt={alt} loading="lazy" decoding="async" className="shot__img" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
