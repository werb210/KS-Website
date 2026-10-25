// Build-time generation of files that depend on environment values: staticwebapp.config.json (CSP needs the
// KS-Ops origin), sitemap.xml and robots.txt (need the public site URL).

export const ROUTES = [
  "/",
  "/features",
  "/pricing",
  "/mobile-apps",
  "/security",
  "/fraud-protection",
  "/faq",
  "/contact",
  "/beta",
  "/signup",
  "/terms",
  "/privacy",
];

export function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildCsp(opts: { opsUrl: string; contactEndpoint?: string; turnstile: boolean }): string {
  const connect = new Set(["'self'"]);
  const ops = originOf(opts.opsUrl);
  if (ops) connect.add(ops);
  const contact = opts.contactEndpoint ? originOf(opts.contactEndpoint) : null;
  if (contact) connect.add(contact);
  const cf = "https://challenges.cloudflare.com";
  return [
    "default-src 'self'",
    `script-src 'self'${opts.turnstile ? ` ${cf}` : ""}`,
    // Google Fonts: the sign-up font picker previews the font the licensee chooses.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${[...connect].join(" ")}`,
    `frame-src ${opts.turnstile ? cf : "'none'"}`,
    "form-action 'self' https://checkout.stripe.com",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function staticWebAppConfig(csp: string) {
  return {
    navigationFallback: {
      rewrite: "/index.html",
      exclude: ["/assets/*", "/*.{svg,png,ico,txt,xml,json,webmanifest,woff,woff2,css,js}"],
    },
    routes: [
      { route: "/assets/*", headers: { "cache-control": "public, max-age=31536000, immutable" } },
      { route: "/index.html", headers: { "cache-control": "no-cache" } },
    ],
    globalHeaders: {
      "Content-Security-Policy": csp,
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    mimeTypes: { ".json": "application/json", ".xml": "application/xml" },
  };
}

export function sitemap(siteUrl: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.map(
    (r) => `  <url><loc>${siteUrl}${r === "/" ? "/" : r}</loc><lastmod>${today}</lastmod></url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robots(siteUrl: string): string {
  return `User-agent: *\nAllow: /\nDisallow: /signup/success\nDisallow: /signup/cancelled\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
