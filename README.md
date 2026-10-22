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

`scripts/check-brand-strings.mjs` fails the build if the vendor's brand name or phone number appears in the source.

## Pages

Home, Features, Pricing, Mobile apps, Security, FAQ, Contact, Terms (draft), Privacy (draft), Sign up,
`/signup/success`, `/signup/cancelled`.

Pricing and sign-up read `GET /api/public/plans`; if that fails they use the bundled copy in `src/lib/plans.ts`.
Keep that copy in step with KS-Ops.
