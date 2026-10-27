// KS_WEBSITE_KB_v1 - help article HTML comes from KS-Ops's own Markdown renderer (everything escaped, a few tags made).
// It is cleaned again here before it is shown: only these tags and attributes survive, links must be https, mailto,
// a site path or another article, and images must be https.
const TAGS = new Set(["P", "H2", "H3", "H4", "UL", "OL", "LI", "STRONG", "EM", "CODE", "A", "IMG", "BLOCKQUOTE", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD", "DIV", "BR"]);
const ATTRS: Record<string, string[]> = { A: ["href", "data-kb-slug"], IMG: ["src", "alt"], DIV: ["class"] };

function safeUrl(tag: string, name: string, value: string): boolean {
  if (tag === "A" && name === "href") return /^(https:\/\/|http:\/\/|mailto:|\/(?!\/)|#kb-[a-z0-9-]+$)/i.test(value);
  if (tag === "IMG" && name === "src") return /^https:\/\//i.test(value);
  return true;
}

export function cleanArticleHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return "";
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!TAGS.has(child.tagName)) {
        child.replaceWith(doc.createTextNode(child.textContent ?? ""));
        continue;
      }
      const allowed = ATTRS[child.tagName] ?? [];
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.includes(attr.name) || !safeUrl(child.tagName, attr.name, attr.value)) child.removeAttribute(attr.name);
      }
      if (child.tagName === "A") {
        const slug = child.getAttribute("data-kb-slug");
        if (slug && /^[a-z0-9-]+$/.test(slug)) child.setAttribute("href", `/help/${slug}`);
        else if (/^https?:/i.test(child.getAttribute("href") ?? "")) {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        }
      }
      if (child.tagName === "IMG") child.setAttribute("loading", "lazy");
      walk(child);
    }
  };
  walk(root);
  return root.innerHTML;
}
