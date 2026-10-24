import { Link } from "react-router-dom";

/** "We build what you need" call-out shown on Home, Features and Pricing. */
export function FeatureRequest() {
  return (
    <section className="section section--surface" aria-labelledby="feature-request-h">
      <div className="wrap">
        <h2 id="feature-request-h">Don't see a feature your business needs?</h2>
        <p style={{ maxWidth: "60ch" }}>
          We can add it. We add new features all the time, and we shape the system around the way our customers
          work. Tell us your idea and we'll turn it into reality.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link className="btn" to="/contact">
            Tell us your idea
          </Link>{" "}
          {/* KS_WEBSITE_BETA_v1 */}
          <Link className="btn btn--ghost" to="/beta">
            Join our beta programme
          </Link>
        </p>
        <p className="small muted" style={{ maxWidth: "60ch" }}>
          Want to try new features first? Beta members get early access and help shape what we build.
        </p>
      </div>
    </section>
  );
}
