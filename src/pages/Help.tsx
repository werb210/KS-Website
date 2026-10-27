// KS_WEBSITE_KB_v1 - public help articles from KS-Ops (/help and /help/:slug). Only published, public articles are
// served; the same library (with staff and admin articles too) is in every customer's portal.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PRODUCT_NAME } from "../config";
import { usePageMeta } from "../hooks/usePageMeta";
import { fetchArticle, fetchArticles, type HelpArticle } from "../lib/assistant";
import { cleanArticleHtml } from "../lib/safeHtml";

function day(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

function HelpIndex() {
  usePageMeta("Help articles", `How ${PRODUCT_NAME} works: plans, trials, security, the client app, importing and more.`, "/help");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState<HelpArticle[] | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => void fetchArticles(q).then((a) => live && setArticles(a)), q ? 250 : 0);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);
  const groups = useMemo(() => {
    const m = new Map<string, HelpArticle[]>();
    for (const a of articles ?? []) m.set(a.category, [...(m.get(a.category) ?? []), a]);
    return [...m.entries()];
  }, [articles]);

  return (
    <div className="wrap wrap--narrow">
      <header className="page-head">
        <h1>Help articles</h1>
        <p>How {PRODUCT_NAME} works, in plain English.</p>
      </header>
      <div className="field">
        <label htmlFor="help-q">Search</label>
        <input id="help-q" type="text" value={q} placeholder="For example: free trial" onChange={(e) => setQ(e.target.value)} />
      </div>
      {articles === null && <p role="alert" className="field-error">Help articles aren't available right now. Please try again later.</p>}
      {articles && articles.length === 0 && <p className="muted">No articles match. Try other words, or ask Maya.</p>}
      {q
        ? articles && articles.length > 0 && (
            <ul className="help-list">{articles.map((a) => <li key={a.slug}><Link to={`/help/${a.slug}`}>{a.title}</Link><span className="muted"> {a.summary}</span></li>)}</ul>
          )
        : groups.map(([cat, list]) => (
            <section key={cat} className="help-group">
              <h2>{cat}</h2>
              <ul className="help-list">{list.map((a) => <li key={a.slug}><Link to={`/help/${a.slug}`}>{a.title}</Link><span className="muted"> {a.summary}</span></li>)}</ul>
            </section>
          ))}
    </div>
  );
}

function HelpArticlePage({ slug }: { slug: string }) {
  const [a, setA] = useState<HelpArticle | null | "missing" | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setA(undefined);
    void fetchArticle(slug).then((r) => live && setA(r));
    return () => {
      live = false;
    };
  }, [slug]);
  const article = a && a !== "missing" ? a : null;
  usePageMeta(article?.title ?? "Help article", article?.summary ?? `${PRODUCT_NAME} help`, `/help/${slug}`);
  const html = useMemo(() => (article?.body_html ? cleanArticleHtml(article.body_html) : ""), [article]);

  return (
    <div className="wrap wrap--narrow">
      <p className="help-back"><Link to="/help">All help articles</Link></p>
      {a === undefined && <p className="muted" aria-busy="true">Loading…</p>}
      {a === null && <p role="alert" className="field-error">This article isn't available right now. Please try again later.</p>}
      {a === "missing" && (
        <header className="page-head"><h1>Article not found</h1><p>It may have moved. <Link to="/help">See all help articles</Link>.</p></header>
      )}
      {article && (
        <article className="help-article">
          <header className="page-head">
            <p className="muted">{article.category}</p>
            <h1>{article.title}</h1>
            {day(article.updated_at) && <p className="muted help-updated">Last updated {day(article.updated_at)}</p>}
          </header>
          <div className="help-body" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      )}
    </div>
  );
}

export default function Help() {
  const { slug } = useParams();
  return slug ? <HelpArticlePage slug={slug} /> : <HelpIndex />;
}
