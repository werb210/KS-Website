import { describe, expect, it } from "vitest";
import { buildCsp, robots, sitemap, staticWebAppConfig } from "../../build/site-files";

describe("static web app config", () => {
  it("allows the KS-Ops origin and Stripe checkout in the CSP", () => {
    const csp = buildCsp({ opsUrl: "https://ops.example.com/base", turnstile: false });
    expect(csp).toContain("connect-src 'self' https://ops.example.com;");
    expect(csp).toContain("form-action 'self' https://checkout.stripe.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("challenges.cloudflare.com");
  });
  it("adds Turnstile only when enabled", () => {
    const csp = buildCsp({ opsUrl: "https://ops.example.com", turnstile: true });
    expect(csp).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
  });
  it("has an SPA fallback and security headers", () => {
    const cfg = staticWebAppConfig("default-src 'self'");
    expect(cfg.navigationFallback.rewrite).toBe("/index.html");
    expect(cfg.globalHeaders["X-Content-Type-Options"]).toBe("nosniff");
    expect(cfg.globalHeaders["Content-Security-Policy"]).toBe("default-src 'self'");
  });
  it("lists public pages in the sitemap and robots", () => {
    const xml = sitemap("https://www.example.com");
    expect(xml).toContain("<loc>https://www.example.com/pricing</loc>");
    expect(xml).not.toContain("/signup/success");
    expect(robots("https://www.example.com")).toContain("Sitemap: https://www.example.com/sitemap.xml");
  });
});
