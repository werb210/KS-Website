# KS-Website

Public marketing site with self-serve sign-up and payment. Vite + React + TypeScript, static, deployed to Azure
Static Web Apps. All data comes from KS-Ops (`/api/public/...`).

## Settings (build time, GitHub repo variables)

| Variable | Required | What it does |
| --- | --- | --- |
| `VITE_OPS_URL` | yes | KS-Ops base URL. Plans, company-code check, sign-up and status calls. Also added to the CSP `connect-src`. |
| `VITE_PRODUCT_NAME` | no (default `Keystone`) | Product name shown everywhere. The only place the name is set. |
| `VITE_SITE_URL` | recommended | Public site origin, for canonical links, `sitemap.xml` and `robots.txt`. |
| `VITE_CONTACT_EMAIL` | recommended | Sales/support inbox for mailto links and the contact form. |
| `VITE_CONTACT_ENDPOINT` | no | If set, the contact form POSTs JSON here instead of opening email. |
| `VITE_TURNSTILE_SITE_KEY` | no | Shows Cloudflare Turnstile on sign-up and allows it in the CSP. |

Secret: `AZURE_STATIC_WEB_APPS_API_TOKEN` (deploy workflow).

`staticwebapp.config.json`, `sitemap.xml` and `robots.txt` are generated at build time (`build/site-files.ts`).

## Commands

```
npm ci
npm run dev          # local dev server
npm run ci           # brand check, lint, typecheck, tests, build
```

App screenshots: real screens of the client app and staff portal from their demo builds, made by
`scripts/screenshots/` (see its README to regenerate them). iPhone dialler and Apple Watch screenshots go in
`src/assets/screens/native/` (`iphone-dialler.png`, `apple-watch.png`).

`scripts/check-brand-strings.mjs` fails the build if the vendor's brand name or phone number appears in the source.

## Pages

Home, Features, Pricing, Mobile apps, Security, FAQ, Help articles (`/help`, `/help/:slug`, KS_WEBSITE_KB_v1), Contact, Terms (draft), Privacy (draft), Sign up,
`/signup/success`, `/signup/cancelled`.

Sign-up branding step: "Use my website" posts the brokerage's address to KS-Ops `POST /api/public/brand-scan`, which
reads the site server-side and suggests a logo, colours and font; they pre-fill the fields (contrast checks still run,
everything stays editable). The font (`font_family`) is sent with the sign-up like the colours. The CSP allows Google
Fonts (`fonts.googleapis.com` styles, `fonts.gstatic.com` fonts) for the font preview.

Pricing and sign-up read `GET /api/public/plans`; if that fails they use the bundled copy in `src/lib/plans.ts`.
Keep that copy in step with KS-Ops.

## Maya, the website assistant (KS_WEBSITE_KB_v1)

A "Questions? Ask Maya" button on every page opens Keystone's sales assistant (KS-Ops `POST /api/public/assistant/chat`).
It answers from the live plan catalogue, the public help articles and the page the visitor is on, links the articles it
used, and offers: try the demo (`/try`), sign up, pricing, book a live demo, or talk to a person. The last two open a lead
form (name, email, brokerage, team size, optional phone, a consent box) sent to `POST /api/public/assistant/lead`, which
puts the lead in the Keystone CRM and emails sales. No cookies: the chat is kept in the tab's sessionStorage. The panel
moves up by `--cookie-banner-height` if a cookie banner is added. Help articles come from `GET /api/public/kb/...` and
are cleaned again in the browser (`src/lib/safeHtml.ts`). No new settings: it uses `VITE_OPS_URL`.
