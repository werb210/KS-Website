#!/usr/bin/env node
// Fails the build when a forbidden string appears in the site's source or public files.
// The product is sold under its own name (VITE_PRODUCT_NAME); the vendor's own brand and phone line never appear.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["src", "public", "index.html", "build"];
const FORBIDDEN = [
  { re: /boreal/i, why: "vendor brand name" },
  { re: /587[\s.\-)]*888[\s.-]*1837/, why: "vendor phone number" },
];
const EXT = /\.(ts|tsx|js|jsx|mjs|css|html|json|svg|txt|xml|md)$/i;

const root = process.cwd();
const hits = [];

function walk(p) {
  let st;
  try {
    st = statSync(p);
  } catch {
    return;
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(p)) if (name !== "node_modules") walk(join(p, name));
    return;
  }
  if (!EXT.test(p)) return;
  const lines = readFileSync(p, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const f of FORBIDDEN) if (f.re.test(line)) hits.push(`${relative(root, p)}:${i + 1}: ${f.why}`);
  });
}

for (const r of ROOTS) walk(join(root, r));

if (hits.length) {
  console.error(`Forbidden brand strings found (${hits.length}):\n${hits.join("\n")}`);
  process.exit(1);
}
console.log("Brand check passed: no forbidden strings in src, public, build or index.html.");
