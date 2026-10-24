#!/usr/bin/env node
// Puts the raw screens from capture.mjs (scripts/screenshots/.raw/*.png) into device frames and writes the files the
// website uses to src/assets/screens/: <name>-<width>.avif and .webp at 1x and 2x, a <name>.png fallback at 1x,
// and sizes.json (the 1x width and height of each, so the page reserves the space before the image loads).
//
//   node scripts/screenshots/frame.mjs
//
// The frame is chosen by the name: client-* = phone, portal-* = browser window, ipad-* = iPad.
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sharp = (await import("sharp")).default;
const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, ".raw");
const OUT = join(HERE, "../../src/assets/screens");

/** Display width (CSS px) of each frame on the site; files are written at 1x and 2x. */
const FRAMES = {
  phone: { width: 300 },
  browser: { width: 800 },
  ipad: { width: 720 },
};

const frameOf = (name) => (name.startsWith("client-") ? "phone" : name.startsWith("ipad-") ? "ipad" : "browser");

/** Rounded-corner mask for the screenshot itself. */
const mask = (w, h, r) => Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);

async function framed(file, kind) {
  const img = sharp(file);
  const { width: w, height: h } = await img.metadata();
  let bezel, top = 0, status = 0, radius, screenRadius, body;
  if (kind === "phone") {
    bezel = Math.round(w * 0.036);
    radius = Math.round(w * 0.15);
    screenRadius = radius - bezel;
    status = Math.round(w * 0.1205); // the 47-point status bar the capture leaves out
    const W = w + bezel * 2, H = h + status + bezel * 2;
    body = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${radius}" fill="#0f172a" stroke="#475569" stroke-width="3"/>
    </svg>`;
  } else if (kind === "ipad") {
    bezel = Math.round(w * 0.022);
    radius = Math.round(w * 0.04);
    screenRadius = Math.round(radius * 0.55);
    const W = w + bezel * 2, H = h + bezel * 2;
    body = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${radius}" fill="#1e293b" stroke="#64748b" stroke-width="3"/>
    </svg>`;
  } else {
    bezel = 2;
    top = Math.round(w * 0.03);
    radius = Math.round(w * 0.009);
    screenRadius = 0;
    const W = w + bezel * 2, H = h + top + bezel;
    const dot = Math.round(top * 0.16);
    const dots = ["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => `<circle cx="${top * 0.5 + i * dot * 3.2}" cy="${top / 2}" r="${dot}" fill="${c}"/>`).join("");
    body = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${radius}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
      ${dots}
      <rect x="${W * 0.3}" y="${top * 0.22}" width="${W * 0.4}" height="${top * 0.56}" rx="${top * 0.28}" fill="#ffffff"/>
    </svg>`;
  }
  let source = img;
  if (status) {
    // The status bar area takes the colour of the app's top edge, so the app reads as running full-screen.
    const { data } = await sharp(file).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    source = sharp(await sharp(file).extend({ top: status, background: { r: data[0], g: data[1], b: data[2], alpha: 1 } }).png().toBuffer());
  }
  const sh = h + status;
  const screen = screenRadius
    ? await source.composite([{ input: mask(w, sh, screenRadius), blend: "dest-in" }]).png().toBuffer()
    : await source.png().toBuffer();
  const base = sharp(Buffer.from(body));
  const layers = [{ input: screen, left: bezel, top: top || bezel }];
  if (kind === "phone") {
    // The camera island sits over the screen, as on the phone.
    const meta = await base.metadata();
    const islandW = Math.round(w * 0.3), islandH = Math.round(w * 0.085);
    layers.push({
      input: Buffer.from(`<svg width="${islandW}" height="${islandH}"><rect width="${islandW}" height="${islandH}" rx="${islandH / 2}" fill="#020617"/></svg>`),
      left: Math.round((meta.width - islandW) / 2),
      top: bezel + Math.round((status - islandH) / 2),
    });
  }
  return base.composite(layers).png().toBuffer();
}

mkdirSync(OUT, { recursive: true });
const sizes = {};
for (const f of readdirSync(RAW).filter((n) => n.endsWith(".png")).sort()) {
  const name = f.replace(/\.png$/, "");
  const kind = frameOf(name);
  const full = await framed(join(RAW, f), kind);
  const one = FRAMES[kind].width;
  for (const scale of [1, 2]) {
    const w = one * scale;
    const resized = sharp(full).resize({ width: w });
    await resized.clone().avif({ quality: 60, effort: 4 }).toFile(join(OUT, `${name}-${w}.avif`));
    await resized.clone().webp({ quality: 80, alphaQuality: 90 }).toFile(join(OUT, `${name}-${w}.webp`));
  }
  const png = await sharp(full).resize({ width: one }).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
  writeFileSync(join(OUT, `${name}.png`), png);
  const meta = await sharp(png).metadata();
  sizes[name] = { width: meta.width, height: meta.height, frame: kind };
  console.log(`  ${name} (${kind}) ${meta.width}x${meta.height}`);
}
writeFileSync(join(OUT, "sizes.json"), JSON.stringify(sizes, null, 2) + "\n");
console.log(`Wrote ${Object.keys(sizes).length} screens to src/assets/screens/`);
