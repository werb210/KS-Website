# Beta programme (KS-Website)

Code marker: `KS_WEBSITE_BETA_v1`. The programme itself is run from KS-Ops (see its `docs/BETA_PROGRAMME.md`).

- `/beta` (`src/pages/BetaProgramme.tsx`): explains the programme (early access, shapes the product, can be switched
  off any time, may change) and has the sign-up form: name, work email, brokerage, interests and an optional note.
- The form posts to KS-Ops `POST /api/public/beta-signup` (same Turnstile and honeypot as the demo form). KS-Ops stores
  it, emails sales and passes it to the Keystone CRM as a website lead with a note of the interests.
- The interest keys in `BETA_INTERESTS` must match KS-Ops `src/routes/publicBeta.ts`; unknown keys are dropped there.
- The "Don't see a feature your business needs?" section (`src/components/FeatureRequest.tsx`) links to `/beta`, and
  `/beta` is in the sitemap.
