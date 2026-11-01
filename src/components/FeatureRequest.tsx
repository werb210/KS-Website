import { Link } from "react-router-dom";

/** "We build what you need" call-out shown on Home, Features and Pricing. KS_WEBSITE_ROADMAP_v1: ideas go to the
 * public roadmap, where other brokers +1 them. */
export function FeatureRequest() {
  return (
    <section className="section section--surface" aria-labelledby="feature-request-h">
      <div className="wrap split split--center">
        <div>
          <h2 id="feature-request-h">Don't see a feature your business needs?</h2>
          <p>
            Tell us. Ideas from brokers go on the public roadmap, other brokers +1 the ones they want, and we build in the
            open: you can see what's requested, planned, being built and shipped.
          </p>
        </div>
        <div className="actions">
          <Link className="btn" to="/roadmap#suggest">
            Tell us your idea
          </Link>
          <Link className="btn btn--quiet" to="/roadmap">
            See the roadmap
          </Link>
          {/* KS_WEBSITE_BETA_v1 */}
          <Link className="btn btn--ghost" to="/beta">
            Join our beta programme
          </Link>
        </div>
      </div>
    </section>
  );
}
