/** Full-page navigation to another site (Stripe Checkout). Wrapped so tests can replace it. */
export function goTo(url: string): void {
  window.location.assign(url);
}
