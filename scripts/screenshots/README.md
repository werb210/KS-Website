# App screenshots on the website

The pictures of the apps on Home, Features and Mobile apps are real screenshots of KS-Client and KS-Portal, taken from
local builds running on the live demo's sample file (Sam Carter, Juniper Hollow Millwork). Both apps answer their own
API calls in the browser in demo mode and the capture script blocks every request that leaves `127.0.0.1`, so no
server is called and no real data can appear.

## Regenerate

From the KS-Website folder, with KS-Client and KS-Portal checked out next to it:

```
# 1. Build both apps (no special settings needed: the demo runs in the browser)
(cd ../KS-Client/client-app && npm ci && npx vite build)
(cd ../KS-Portal && npm ci && npx vite build)

# 2. Tools for the capture (not part of the site's dependencies)
npm i --no-save playwright sharp && npx playwright install chromium

# 3. Capture, then frame and optimise
node scripts/screenshots/capture.mjs --client-dist ../KS-Client/client-app/dist --portal-dist ../KS-Portal/dist
node scripts/screenshots/frame.mjs
```

- `capture.mjs` writes raw PNGs to `scripts/screenshots/.raw/` (git-ignored). `--only client-wizard,portal-fraud`
  captures a subset. On a machine that cannot reach Google Fonts, pass `--font-css <file>` with `@font-face` rules
  for Public Sans, Libre Caslon Text and Inter; it is answered in place of `fonts.googleapis.com`.
- `frame.mjs` puts each one in a frame (`client-*` phone, `portal-*` browser window, `ipad-*` iPad) and writes
  `src/assets/screens/<name>-<w>.avif|.webp` at 1x and 2x, `<name>.png` (1x fallback) and `sizes.json`.
- Alt text and captions live in `src/lib/screens.ts` and the pages; a new screen needs an `SCREEN_ALT` entry.
- The screens: client wizard step and client portal (phone); pipeline, documents, financials, bank summary chart,
  credit summary, fraud score, lenders and loan calculator (browser); documents on iPad.

If an app's demo changes (new tour step order, test ids), adjust the steps in `capture.mjs`.

## iPhone dialler and Apple Watch

Those apps are native and can't be captured here. Put their screenshots in `src/assets/screens/native/` as
`iphone-dialler.png` and `apple-watch.png` (PNG, JPG or WebP); the Mobile apps page shows them in place of the
drawings on the next build. See `src/assets/screens/native/README.md`.
