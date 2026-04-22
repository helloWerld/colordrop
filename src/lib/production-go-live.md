# Switching ColorDrop to production

This checklist turns the app from **local / test integrations** into a **live** deployment: real payments (Stripe), real print jobs (Lulu), verified webhooks, and production auth and data.

**What “production” means in this codebase**

- The host sets `NODE_ENV=production` (Next.js does this automatically for `next build` / `next start` and on typical platforms such as Vercel).
- Several behaviors are gated on that flag: Stripe Tax on checkout, strict Lulu webhook signature verification, cron authentication, and stricter image-conversion env rules (see `getConversionProviderConfig` in `conversion-provider-config.ts` and `checkProductionEnv` in `production-env-check.ts`).

Use this document together with [`.env.example`](../../.env.example) (full variable list and comments) and the short ops list in [`README.md`](../../README.md).

---

## 1. Use a dedicated production Supabase project

1. Create or select the **production** Supabase project (not the one you used for day-to-day dev testing, unless you intentionally run a single project for both).
2. In **Project Settings → API**, copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into your production environment (e.g. Vercel **Environment Variables**), not into a committed file.
3. In **Project Settings → Database → Connection string**, choose **Connection pooling** and copy the **URI** (host should include `pooler.supabase.com`, port **6543**). Set this as `DATABASE_URL` for migrations. Avoid the direct `db.*.supabase.co` URI for app/migrate use—it can fail with DNS issues (see [`README.md`](../../README.md)).
4. From your machine (with `DATABASE_URL` pointing at the **production** pooler URI), run:

   ```bash
   npm run db:migrate
   ```

5. Ensure Storage buckets exist: `originals`, `outlines`, `covers`, `pdfs` (Supabase Dashboard → Storage, or `npm run storage:create-buckets` with production credentials configured locally—only when you intend to touch the prod project).

---

## 2. Clerk (authentication)

1. In the [Clerk Dashboard](https://dashboard.clerk.com), use a **production** instance (or production keys for your app).
2. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to the **production** `pk_live_…` / `sk_live_…` values in the deployment environment.
3. Configure **allowed origins / redirect URLs** for your real site (e.g. `https://yourdomain.com` and `https://www.yourdomain.com` if you use both).
4. Keep the `NEXT_PUBLIC_CLERK_*_URL` and after-sign-in/up paths aligned with your routes (defaults are in `.env.example`).

Optional: set `ADMIN_EMAIL_ALLOWLIST` for admin UI and admin APIs (comma-separated emails).

---

## 3. Point the app at the real site URL

Set **`NEXT_PUBLIC_APP_URL`** to the canonical public origin of the deployed app, with scheme and no trailing path (example: `https://colordrop.ai`).

Checkout success/cancel URLs and other redirects depend on this (`site-url` helper and checkout code). After deploy, this must match the URL users see in the browser.

---

## 4. Turn off sandbox modes (Stripe and Lulu)

For live money and real print fulfillment:

| Variable | Production value |
|----------|------------------|
| `STRIPE_USE_SANDBOX` | Omit, or set exactly to `false` (only the string `true` enables sandbox—see `stripe.ts`). |
| `LULU_USE_SANDBOX` | Omit, or set exactly to `false`. |

Then configure **live** Stripe keys and **production** Lulu API credentials (next sections). Redeploy or restart after changing env vars.

**Important:** If `LULU_USE_SANDBOX=true` but sandbox keys are missing, the app may still call **production** Lulu when `LULU_CLIENT_KEY` / `LULU_CLIENT_SECRET` are set (`lulu.ts`). For a clean production cutover, set `LULU_USE_SANDBOX=false` (or unset) and verify sandbox vars are not overriding behavior.

---

## 5. Stripe (live mode)

1. In the Stripe Dashboard, switch to **Live** mode for the objects you configure.
2. Set **`STRIPE_SECRET_KEY`** (`sk_live_…`) and **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** (`pk_live_…`).
3. Create a **webhook endpoint** pointing to:

   `https://<your-domain>/api/webhooks/stripe`

   Subscribe to the events your app expects (see `src/app/api/webhooks/stripe/route.ts` if you need the exact list).
4. Set **`STRIPE_WEBHOOK_SECRET`** to the signing secret for that **live** endpoint (starts with `whsec_`). It must match the mode used by `getStripe()` / `getStripeWebhookSecret()` in `stripe.ts` (live when sandbox is off).
5. Configure **Stripe Tax** for the regions you sell into (README ops checklist mentions **US + CA** where required).
6. After deploy, confirm live mode in the app (no test-mode banner unless you intentionally use sandbox keys with the sandbox flag).

---

## 6. Lulu (production API)

1. Use production API credentials: **`LULU_CLIENT_KEY`**, **`LULU_CLIENT_SECRET`**, **`LULU_API_BASE_URL=https://api.lulu.com`**.
2. Register a Lulu webhook for **print job status** (or equivalent) pointing to:

   `https://<your-domain>/api/webhooks/lulu`

3. Set **`LULU_WEBHOOK_SECRET`** to the shared secret Lulu uses for HMAC verification. In production, missing secret or bad signature causes failures (`src/app/api/webhooks/lulu/route.ts`).
4. Set contact/email vars as needed: **`LULU_CONTACT_EMAIL`**, **`RESEND_FROM_EMAIL`**, **`OPS_ALERT_EMAIL`** (see `.env.example`).

---

## 7. Image conversion (Gemini / OpenAI)

Configure at least one provider per your mode (`IMAGE_CONVERSION_PROVIDER` in `.env.example`: `auto` | `gemini` | `openai`).

- **`auto` (default):** In production, **`OPENAI_API_KEY` is required** even if you primarily use Gemini, so the OpenAI fallback is available (`conversion-provider-config.ts`).
- **`gemini`:** Only **`GEMINI_API_KEY`** is required in production.
- **`openai`:** Only **`OPENAI_API_KEY`** is required.

Optional model overrides are documented in `conversion-model-env.ts`.

---

## 8. Email (Resend)

Set **`RESEND_API_KEY`** (production key), **`RESEND_FROM_EMAIL`** (verified sender/domain in Resend), and operational addresses (`OPS_ALERT_EMAIL`, support email vars) per `.env.example`. The production readiness helper warns if `RESEND_API_KEY` is missing (`production-env-check.ts`).

---

## 9. Cron job (original image cleanup)

In production, **`CRON_SECRET` is required**. The cleanup route rejects unauthenticated calls when `NODE_ENV=production`.

- **Endpoint:** `GET /api/cron/cleanup-originals`
- **Header:** `Authorization: Bearer <CRON_SECRET>`

Schedule it **daily** (see [`docs/retention-policy.md`](../../docs/retention-policy.md)). On Vercel, configure Cron in the project so the request includes that header (or use an external scheduler that can send custom headers).

---

## 10. Deploy the application

1. Set **all** production environment variables on the host (copy from `.env.example` as a template; do not commit secrets).
2. Run a local smoke build if you like:

   ```bash
   npm run build
   ```

3. Deploy with your platform’s default production command (`next build` + `next start`, or the platform equivalent). Ensure the deployment is marked **Production** so `NODE_ENV=production`.

---

## 11. Verify before announcing go-live

1. **`GET /api/health`** on the production origin should return **HTTP 200** with `"ok": true` when Supabase, Stripe, and Lulu checks pass. The JSON includes:
   - `warnings` — from `checkProductionEnv()` (live Stripe key prefixes, missing `LULU_WEBHOOK_SECRET`, missing `CRON_SECRET`, missing `NEXT_PUBLIC_APP_URL`, etc.).
   - `checks` — connectivity/latency for env, Supabase, Stripe, and Lulu.

2. Manually exercise: sign-in, a small conversion, credit purchase (if applicable), book checkout, and webhook-driven updates (or Stripe/Lulu dashboard test tools where available).

3. Confirm **`NEXT_PUBLIC_APP_URL`** matches the live URL and Clerk redirects work end-to-end.

---

## 12. After go-live

- Monitor Stripe and Lulu dashboards for failed webhooks or API errors.
- Keep sandbox keys only in non-production environments or behind `STRIPE_USE_SANDBOX=true` / `LULU_USE_SANDBOX=true` on a **staging** deployment—never mix test signing secrets with live endpoints.

If you add new env vars later, update `.env.example` and re-check `/api/health` on production after each deploy.
