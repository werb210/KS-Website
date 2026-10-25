#!/usr/bin/env node
// Captures the real app screens shown on the website, from local builds of KS-Client and KS-Portal running on their
// built-in sample data (the live demo: Sam Carter / Juniper Hollow Millwork). Nothing real is shown and no server is
// called: both apps answer their own API calls in the browser in demo mode, and every request that leaves
// 127.0.0.1 is blocked.
//
//   node scripts/screenshots/capture.mjs --client-dist ../KS-Client/client-app/dist --portal-dist ../KS-Portal/dist
//
// Writes raw PNGs to scripts/screenshots/.raw/. Then run frame.mjs to put them in device frames and write the
// optimised files to src/assets/screens/. See scripts/screenshots/README.md.
/* global window, document, sessionStorage, localStorage, Notification -- used inside page.evaluate / addInitScript, which run in the browser */
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, ".raw");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
}

const clientDist = resolve(arg("client-dist", "../KS-Client/client-app/dist"));
const portalDist = resolve(arg("portal-dist", "../KS-Portal/dist"));
// Optional: a CSS file answered for fonts.googleapis.com (for machines that cannot reach Google Fonts).
const fontCssFile = arg("font-css", "");
const only = arg("only", "");

const onlyNames = only ? only.split(",") : [];
const needClient = !only || onlyNames.some((n) => n.startsWith("client-"));
const needPortal = !only || onlyNames.some((n) => /^(portal|ipad)-/.test(n));
for (const d of [needClient ? clientDist : null, needPortal ? portalDist : null].filter(Boolean)) {
  if (!existsSync(join(d, "index.html"))) {
    console.error(`No build at ${d}. Build it first (npx vite build in that repo).`);
    process.exit(1);
  }
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff",
  ".webmanifest": "application/manifest+json", ".ico": "image/x-icon", ".pdf": "application/pdf",
};

/** A static server for a built single-page app (unknown paths get index.html), like vite preview. */
function serve(dir) {
  return new Promise((ok) => {
    const server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
      let file = join(dir, p);
      if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) file = join(dir, "index.html");
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => ok({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

const { chromium } = await import("playwright");
mkdirSync(RAW, { recursive: true });
const fontCss = fontCssFile ? readFileSync(fontCssFile, "utf8") : null;
const client = await serve(clientDist);
const portal = needPortal ? await serve(portalDist) : null;
const browser = await chromium.launch();

async function context(opts) {
  const ctx = await browser.newContext({ serviceWorkers: "block", locale: "en-CA", timezoneId: "America/Edmonton", ...opts });
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) =>
    fontCss && r.request().url().startsWith("https://fonts.googleapis.com/")
      ? r.fulfill({ contentType: "text/css", body: fontCss })
      : r.abort(),
  );
  return ctx;
}

const want = (name) => !only || only.split(",").includes(name);
const shot = async (page, name) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(RAW, `${name}.png`) });
  console.log(`  ${name}.png`);
};

// ---- client app (phone) ------------------------------------------------------------------------------------------
{
  // iPhone 15 screen (390 x 844) less its 47-point status bar, which frame.mjs draws (with the camera island) above the app.
  const ctx = await context({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${client.url}/tour`, { waitUntil: "commit" });
  const tour = page.locator('[data-testid="live-demo-tour"]');
  await tour.waitFor({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  // The tour pop-up is hidden only while the picture is taken; its Next button walks through the sample application.
  const capture = async (name) => {
    if (!want(name)) return;
    await page.addStyleTag({ content: '[data-testid="live-demo-tour"]{visibility:hidden!important}' }).then((h) => h.evaluate((el) => el.setAttribute("data-shot", "")));
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, name);
    await page.evaluate(() => document.querySelectorAll("style[data-shot]").forEach((s) => s.remove()));
  };
  const next = async (times = 1) => {
    for (let i = 0; i < times; i++) {
      await page.locator('[data-testid="live-demo-card"] button', { hasText: /^Next$/ }).click();
      await page.waitForTimeout(1800);
    }
  };
  await next(3); // profile -> product -> closing costs -> business details
  await capture("client-wizard");
  await next(4); // owners -> documents -> terms -> submitted: the client's own portal
  await page.waitForTimeout(1500);
  await capture("client-portal");
  // KS-Client v13: the loan calculator on the More tab (More -> Loan calculator).
  if (want("client-calculator")) {
    // The tour is over by now; its pop-up would sit over the tab bar.
    await page.addStyleTag({ content: '[data-testid="live-demo-tour"]{display:none!important}' });
    await page.locator('[data-testid="cmp-tab-more"]').click();
    await page.locator('[data-testid="cmp-more-calculator"]').click({ timeout: 10_000 });
    await page.getByRole("dialog", { name: "Loan calculator" }).waitFor({ timeout: 10_000 });
    await page.waitForTimeout(800);
    await capture("client-calculator");
  }
  await ctx.close();
}

// ---- staff portal (browser, iPad) --------------------------------------------------------------------------------
const STEPS = { pipeline: 0, documents: 1, financials: 3, banking: 4, credit: 5, fraud: 6, lenders: 8 };

async function portalPage(viewport, scale, step) {
  const ctx = await context({ viewport, deviceScaleFactor: scale });
  await ctx.addInitScript((index) => {
    // The broker side of the live demo: the real portal on the sample file (KS-Portal src/demo/broker).
    sessionStorage.setItem("ks_live_demo_mode", "broker");
    sessionStorage.setItem("ks_live_demo_tour_v1", JSON.stringify({ index }));
    localStorage.setItem("ks_live_demo_v1", JSON.stringify({ link: { demoId: "screens", token: "screens" }, session: null }));
    localStorage.setItem("bf_theme", "light");
    try { Object.defineProperty(Notification, "permission", { get: () => "default" }); } catch { /* not in every browser */ }
  }, step);
  const page = await ctx.newPage();
  await page.goto(`${portal.url}/pipeline`, { waitUntil: "commit" });
  await page.waitForTimeout(5000);
  // The tour card, spotlight, pop-up toasts and the "notifications are blocked" hint are not part of the product.
  await page.addStyleTag({
    content: `.ksld-tour,.ksld-dim,.ksld-spot,.ksld-call,[data-sonner-toaster],.Toastify,[role="status"][aria-live]{display:none!important}`,
  });
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      if (/^Notifications are blocked/.test(el.textContent ?? "") && el.children.length === 0) el.style.visibility = "hidden";
    }
  });
  return { ctx, page };
}

const DESKTOP = { width: 1440, height: 900 };
for (const [key, step] of Object.entries(STEPS)) {
  const name = `portal-${key}`;
  if (!want(name)) continue;
  const { ctx, page } = await portalPage(DESKTOP, 2, step);
  await shot(page, name);
  if (key === "lenders" && want("portal-calculator")) {
    const open = page.locator('[data-testid="open-loan-calculator"]');
    if (await open.count()) {
      await open.click();
      await page.waitForTimeout(1200);
      await shot(page, "portal-calculator");
    }
  }
  await ctx.close();
}

if (want("ipad-documents")) {
  // iPad Air 11" landscape. The portal runs on iPad as the staff app.
  const { ctx, page } = await portalPage({ width: 1180, height: 820 }, 2, STEPS.documents);
  await shot(page, "ipad-documents");
  await ctx.close();
}

await browser.close();
client.server.close();
portal?.server.close();
console.log(`Raw screens in ${RAW}. Next: node scripts/screenshots/frame.mjs`);
