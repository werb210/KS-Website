/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { buildCsp, robots, sitemap, staticWebAppConfig } from "./build/site-files";

function siteFiles(env: Record<string, string>): Plugin {
  const productName = (env.VITE_PRODUCT_NAME || "Keystone").trim();
  const siteUrl = (env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return {
    name: "ks-site-files",
    transformIndexHtml(html) {
      let out = html.replace(/__PRODUCT_NAME__/g, escape(productName));
      if (siteUrl) out = out.replace(/__SITE_URL__/g, escape(siteUrl));
      else out = out.replace(/\s*<link rel="canonical"[^>]*>/, "").replace(/\s*<meta property="og:url"[^>]*>/, "");
      return out;
    },
    generateBundle() {
      const csp = buildCsp({
        opsUrl: env.VITE_OPS_URL || "",
        contactEndpoint: env.VITE_CONTACT_ENDPOINT || "",
        turnstile: Boolean((env.VITE_TURNSTILE_SITE_KEY || "").trim()),
      });
      this.emitFile({
        type: "asset",
        fileName: "staticwebapp.config.json",
        source: JSON.stringify(staticWebAppConfig(csp), null, 2) + "\n",
      });
      if (siteUrl) {
        this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap(siteUrl) });
        this.emitFile({ type: "asset", fileName: "robots.txt", source: robots(siteUrl) });
      } else {
        this.warn("VITE_SITE_URL not set: sitemap.xml skipped and robots.txt has no Sitemap line.");
        this.emitFile({ type: "asset", fileName: "robots.txt", source: "User-agent: *\nAllow: /\n" });
      }
      if (!env.VITE_OPS_URL) this.warn("VITE_OPS_URL not set: pricing uses the bundled copy and sign-up will fail.");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...pickVite(process.env) };
  return {
    plugins: [react(), siteFiles(env)],
    build: { outDir: "dist", sourcemap: false, target: "es2020" },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      restoreMocks: true,
      env: { VITE_OPS_URL: "https://ops.test", VITE_PRODUCT_NAME: "Keystone", VITE_CONTACT_EMAIL: "hello@example.com" },
    },
  };
});

function pickVite(e: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e)) if (k.startsWith("VITE_") && v) out[k] = v;
  return out;
}
