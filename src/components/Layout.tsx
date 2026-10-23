import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CONTACT_EMAIL, PRODUCT_NAME } from "../config";
import { Mark } from "./Mark";

const NAV = [
  { to: "/features", label: "Features" },
  { to: "/fraud-protection", label: "Fraud protection" },
  { to: "/pricing", label: "Pricing" },
  { to: "/mobile-apps", label: "Mobile apps" },
  { to: "/security", label: "Security" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo?.(0, 0);
  }, [pathname]);

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
          <button
            type="button"
            className="btn btn--quiet menu-toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Close menu" : "Menu"}
          </button>
          <nav id="site-nav" className="site-nav" aria-label="Main" data-open={open}>
            <ul>
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to}>{n.label}</NavLink>
                </li>
              ))}
              <li>
                <NavLink to="/try">Try it yourself</NavLink>
              </li>
              <li>
                <Link className="btn" to="/signup">
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap site-footer__grid">
          <div>
            <p className="brand" style={{ color: "#fff" }}>
              {PRODUCT_NAME}
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
          <div>
            <h2>Product</h2>
            <ul>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/fraud-protection">Fraud protection</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/mobile-apps">Mobile apps</Link></li>
              <li><Link to="/security">Security and data</Link></li>
            </ul>
          </div>
          <div>
            <h2>Company</h2>
            <ul>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/terms">Terms of service</Link></li>
              <li><Link to="/privacy">Privacy policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="wrap">
          <p className="small" style={{ marginTop: "2rem", color: "#b9c5d0" }}>
            © {new Date().getFullYear()} {PRODUCT_NAME}. Prices in Canadian dollars unless noted.
          </p>
        </div>
      </footer>
    </>
  );
}
