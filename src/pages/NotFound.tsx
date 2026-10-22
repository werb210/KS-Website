import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found", "This page doesn't exist.");
  return (
    <div className="wrap wrap--narrow page-head">
      <h1>This page doesn't exist</h1>
      <p>
        The link may be old or mistyped. Go to the <Link to="/">home page</Link> or <Link to="/pricing">see pricing</Link>.
      </p>
    </div>
  );
}
