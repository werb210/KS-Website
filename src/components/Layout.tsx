import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CONTACT_EMAIL, PRODUCT_NAME } from "../config";
import { Mark } from "./Mark";
import { SalesAssistant } from "./SalesAssistant"; // KS_WEBSITE_KB_v1

// KS_WEBSITE_OVERHAUL - four links and two actions in the bar; everything else is one tap away in the menu (on a phone)
// and in the footer. The rest of the pages are linked from the pages that need them.
const NAV = [
  { to: "/why-keystone", label: "Why Keystone" },
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/security", label: "Security" },
];

/** Shown in the phone menu under the main links. */
const MORE = [
  { to: "/try", label: "Try it yourself" },
  { to: "/compare", label: "Compare CRMs" },
  { to: "/fraud-protection", label: "Fraud protection" },
  { to: "/mobile-apps", label: "Mobile apps" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

const FOOTER: Array<{ title: string; links: Array<{ to: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { to: "/features", label: "Features" },
      { to: "/fraud-protection", label: "Fraud protection" },
      { to: "/security", label: "Security and compliance" },
      { to: "/mobile-apps", label: "Mobile apps" },
      { to: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Deciding",
    links: [
      { to: "/why-keystone", label: "Why switch" },
      { to: "/compare", label: "Compare CRMs" },
      { to: "/pricing", label: "Pricing" },
      { to: "/try", label: "Try it yourself" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/help", label: "Help articles" },
      { to: "/contact", label: "Contact" },
      { to: "/beta", label: "Beta programme" },
      { to: "/terms", label: "Terms of service" },
      { to: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    setOpen(false);
    if (!hash) {
      window.scrollTo?.(0, 0);
      return;
    }
    // A link to a section of another page (/roadmap#suggest): wait for the lazily loaded page, then go to it.
    let tries = 0;
    let timer = 0;
    const find = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) el.scrollIntoView?.();
      else if (tries++ < 40) timer = window.setTimeout(find, 50);
    };
    find();
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap site-header__bar">
          <Link to="/" className="brand" aria-label={`${PRODUCT_NAME} home`}>
            <Mark />
            <span>{PRODUCT_NAME}</span>
          </Link>
          <nav id="site-nav" className="site-nav" aria-label="Main" data-open={open}>
            <ul className="site-nav__main">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
            <ul className="site-nav__more" aria-label="More pages">
              {MORE.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-header__actions">
            <Link className="btn btn--quiet btn--try" to="/try">
              Try it
            </Link>
            <Link className="btn" to="/signup">
              Sign up
            </Link>
            <button
              type="button"
              className="btn btn--quiet menu-toggle"
              aria-expanded={open}
              aria-controls="site-nav"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap site-footer__grid">
          <div>
            <p className="brand brand--footer">
              <Mark color="#ffffff" />
              <span>{PRODUCT_NAME}</span>
            </p>
            <p>
              The complete system for commercial lending and business financing brokerages. Hosted in Canada, licensed
              per seat.
            </p>
            {CONTACT_EMAIL && (
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
            )}
          </div>
          {FOOTER.map((g) => (
            <div key={g.title}>
              <h2>{g.title}</h2>
              <ul>
                {g.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="wrap">
          <p className="small site-footer__legal">
            © {new Date().getFullYear()} {PRODUCT_NAME}. Prices in Canadian dollars unless noted.
          </p>
        </div>
      </footer>
      <SalesAssistant />
    </>
  );
}
