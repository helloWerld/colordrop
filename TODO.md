# ColorDrop — pre-launch checklist

Checklist aligned with product decisions (see **Decisions log**). Check items off as you complete them.

---

## Decisions log (reference)

- **Shipping**: USA and Canada only for now; reflect clearly in marketing and checkout.
- **Refunds / replacements**: All coloring books are custom printed — **no refunds or replacements** as a baseline for buyer’s remorse / change of mind. **Exception (ops):** If fulfillment cannot be completed after payment (e.g. Lulu submission fails after retries), **automatic Stripe refund** — see **Critical (money, fulfillment, security)**. Review **Lulu’s policy on misprints / manufacturing defects** separately.
- **Support**: **hello@colordrop.ai** — target first response within **72 hours**.
- **Margins**: Book/shipping markups are **not yet validated**; admin tooling should expose costs vs markups for review.
- **Credits**: Credits are **only** for image conversions. **Cannot** be applied to book printing or shipping. Messaging must be clear everywhere; remove legacy fields/code paths that imply credits apply to books.
- **Tax**: Registered in USA; collect tax where required for **USA and Canada** — **must be completed** in Stripe before production launch.
- **Stripe Customer Portal**: **Skip for v1** — no self-serve billing portal at launch; revisit post-launch if needed.
- **Email**: **Stripe** customer emails first (payment receipts), then **Resend** for product confirmations/notifications — see _Recommendations_ below.
- **Lulu**: Printing/fulfillment via Lulu API behind the scenes — see _Recommendations_.
- **After payment**: When payment completes, the **PDF used for printing must be frozen** — **DB snapshot** at payment (no need to retain historical edit artifacts over time). **No edits** to book/PDF content after payment.
- **Conversion AI**: **Gemini (Nano Banana)** primary; **OpenAI** (`openai-fallback.ts`) as **second** step when Gemini fails.
- **Stylization**: **Removed** — single default outline only; no stylization column or UI.
- **Auth**: **Email/password**, **Google**, and **Facebook** enabled at launch (Clerk).
- **Admin access**: **Email allowlist** for admin dashboard and admin-only APIs (no separate product decision on Clerk roles beyond that).
- **Uploads**: Require a **checkbox**: representation of rights, consent, agreement to Terms & Privacy (and copyright/DMCA expectations as part of that agreement).
- **GDPR**: Data subject requests handled **manually** via customer support (no self-serve export portal required for launch).
- **Moderation**: **Terms + reactive takedown** (no automated moderation pipeline for launch).
- **Infra**: No multi-region / data residency requirement.
- **Analytics / errors**: **Vercel Analytics** only — **do not** add Sentry. **Custom logging** for Stripe and Lulu: **searchable log viewer** in the **admin dashboard**.
- **`/api/config`**: **Not public** — **gate behind admin** (or remove public exposure of sandbox/test flags).
- **Uptime**: Add **`GET /api/health`** for external uptime monitors.
- **SEO**: Add **sitemap** and follow **SEO recommendations** in the SEO section below.
- **Data retention**: Stakeholder preference: **~6 months** for retention where applicable — **must be reconciled** with implementation and legal/tax obligations (see _Open questions_).

---

## Recommendations (chargebacks, email, Lulu account)

- **Chargebacks:** Turn on **Stripe Radar** with default rules; watch dispute rate in Stripe Dashboard. If fraud or disputes rise, tighten rules or enable **3D Secure** for higher-risk payments. Tune after first real traffic.
- **Stripe vs Resend:** **Stripe** = official **payment receipts** (amount, last4, receipt link). **Resend** = ColorDrop-branded order confirmation and shipping updates.
- **Lulu account:** Single Lulu API integration (production keys in secure env); sandbox keys separate for testing. Document account owner and backup API credentials.
- **Lulu customer-facing defects:** Review Lulu’s published policies on misprints / reprints; align Terms and support scripts (separate from **technical** auto-refund when ColorDrop cannot submit print).

---

## Reference: Stripe Customer Portal (what it is — deferred)

**Stripe Customer Portal** is a hosted Stripe page for **self-serve** tasks: update **payment methods**, view **billing history** and **invoices**, and sometimes **cancel subscriptions**. It does **not** replace your app’s order history for physical books. **v1 decision: skip** — users pay via Checkout per order; card updates can happen on the next checkout or via support. Revisit after launch if you want a dedicated “manage payment method” flow without support.

---

## Open questions (please confirm)

1. **Retention “6 months” vs code today:** The app currently has logic tied to **90 days after fulfillment** for original-image cleanup (`/api/cron/cleanup-originals`). Does **6 months** mean (a) replace 90 days with ~180 days for originals, (b) a blanket cap on all customer data, or (c) something else? **Tax/accounting** often requires keeping order/financial records longer than 6 months — confirm with counsel so policy and code match.
2. **“No replacements” vs Lulu:** If Lulu’s policy **does** offer reprint for manufacturing defects, do you want ColorDrop to **pass that through** to customers (still no cash refund), or **no replacements under any circumstance**? Wording in Terms depends on this.

---

## Critical (money, fulfillment, security)

- [x] **Duplicate book checkout:** Block checkout when the book already has an order or is already paid.
- [x] **Webhook on failed order insert:** If order **insert** fails after successful payment (DB/unique constraint), alert ops and reconcile; **refund in Stripe** if payment cannot be matched to an order (avoid stranded charges).
- [x] **Fulfillment failure → retry Lulu, then auto-refund:** After payment, if **`runFulfillment`** / Lulu print submission fails, **retry** Lulu submission (define max attempts/backoff in code). If retries are exhausted, **automatic Stripe refund** for that charge, update order state, notify customer and **hello@colordrop.ai**. Document in Terms that this applies to **inability to print/fulfill**, not discretionary refunds.
- [x] **Cron auth:** Reject unauthenticated `GET /api/cron/cleanup-originals` in production (`CRON_SECRET` required).
- [ ] **Lulu webhook:** Require `LULU_WEBHOOK_SECRET` + valid signature in production.
- [ ] **Stripe production:** Live keys, webhooks, `NEXT_PUBLIC_APP_URL`, Stripe Tax configured for **US + CA** where required.
- [ ] **Lulu production:** Sandbox off; production keys and API URL; no accidental mixing.
- [x] **Freeze book at payment (DB snapshot):** Persist a **snapshot** of book + pages + cover data (and generated PDFs or inputs needed for Lulu) at payment time; **block all mutations** to that book after payment. No requirement to keep pre-payment edit history.
- [x] **Fulfillment runbook:** Support playbooks for retry/refund path, Lulu defects vs technical failure, alignment with Lulu’s misprint policy.

---

## Admin dashboard (internal only)

- [x] **Access control:** **Email allowlist** for admins only; protect all `/admin` routes and admin-only APIs.
- [x] **Customers / users:** List/search profiles, credits (free + paid), account metadata needed for support.
- [x] **Orders:** All orders, statuses, Stripe IDs, Lulu job IDs, amounts, shipping, errors.
- [x] **Markups & economics:** Surface **Lulu costs vs customer price** (book + shipping markups) for pricing validation.
- [x] **Conversions / usage:** Image conversions, failures, provider (**Gemini** vs **OpenAI**), costs if available.
- [x] **Images / content:** View customer uploads and generated outlines for support (with privacy safeguards).
- [x] **Custom logging:** **Searchable log viewer** for **Stripe** (webhooks, key events, anomalies) and **Lulu** (API responses, print job status, errors).

---

## Product, UX & copy

- [x] **Credits vs printing:** Update **all** customer-facing copy: credits **only** for conversions; book printing + shipping **always separate charges**.
- [x] **Support contact:** **hello@colordrop.ai** everywhere; **72h** response target where appropriate.
- [x] **USA/Canada only:** Obvious on marketing and checkout.
- [x] **Upload agreement checkbox:** Rights, consent, Terms & Privacy, copyright/DMCA as agreed.
- [x] **Terms of Service:** No refunds for custom goods (except **technical non-fulfillment** auto-refund if implemented); Lulu misprint policy; support email; reactive takedown.
- [x] **Order confirmation UX:** Polling / messaging when webhook is slow (`/order/confirmation`).

---

- [ ] **Stripe Customer Portal:** **Out of scope for v1** — do not enable Customer Portal in Stripe Dashboard for launch (see **Reference** above; revisit post-launch).

---

## Resend & transactional email

**Code status:** Resend is already wired in `src/lib/email.ts` (`resend` package): **order confirmation** after payment (Stripe webhook), **shipping / tracking** (Lulu webhook when status ships), **customer email on technical fulfillment failure** (refund path), and **ops alerts** (e.g. Stripe webhook reconciliation). If `RESEND_API_KEY` is missing, sends are skipped and ops alerts fall back to `console.error` — acceptable for local dev, not for production.

- [x] **Resend account & production API key:** Create/configure Resend for production; add `RESEND_API_KEY` to Vercel (or host) **production** env; use a separate test/preview key for non-prod if you want to avoid sending real mail from dev.
- [x] **Domain & DNS (deliverability):** In Resend, **verify the sending domain** (e.g. `colordrop.ai` or `mail.colordrop.ai` per your choice). Add the DNS records Resend provides (SPF, DKIM; DMARC as recommended). Until the domain is verified, production sends from `@colordrop.ai` may fail or use Resend’s sandbox constraints.
- [x] **`RESEND_FROM_EMAIL`:** Set explicitly to a **verified** sender (format matches `email.ts`, e.g. `ColorDrop <orders@colordrop.ai>`). Defaults in code assume `orders@colordrop.ai` — the address must be allowed for the verified domain.
- [x] **`OPS_ALERT_EMAIL`:** Confirm the inbox for internal alerts (defaults to `hello@colordrop.ai` in code). Override in env if ops uses a different address; ensure it is monitored.
- [x] **`LULU_CONTACT_EMAIL`:** Set for Lulu print-job **contact_email** (see `src/lib/fulfillment.ts`); if unset, code falls back to `RESEND_FROM_EMAIL`. Align with support/ops expectations (may match `orders@` or `hello@`).
- [ ] **End-to-end mail checks (staging):** With real webhooks or manual triggers, confirm: order confirmation after checkout, shipping email when Lulu marks shipped, fulfillment-failure email on forced failure path, and ops alert path if you simulate a reconciliation alert. Spot-check spam placement and from/reply expectations.
- Evidence/work completed in codebase:
  - Added env documentation for `RESEND_FROM_EMAIL`, `OPS_ALERT_EMAIL`, and `LULU_CONTACT_EMAIL` in `.env.example`.
  - Added operator runbook instructions and acceptance evidence in `docs/fulfillment-runbook.md`.
  - Added automated coverage for transactional email send paths in `src/lib/email.test.ts`.
  - **Vitest:** `npm test` — 18 files, 83 tests passed (2026-04-08). Email paths are exercised with mocked Resend; staging E2E mail (item above) is still manual per `docs/fulfillment-runbook.md`.
- [ ] **(Optional, later)** Resend **webhooks** for bounces/complaints or a suppression workflow — not required for v1 if volume is low; revisit if deliverability issues appear.

---

## Fulfillment & Lulu

- [x] **Lulu policy review:** Document misprint / defect handling from Lulu’s official policy; align support script and Terms.
- [x] **PDF signed URLs:** Ensure Lulu retrieves PDFs before URL expiry (or adjust TTL/strategy).

---

## AI & conversion pipeline

- [x] **Wire OpenAI as fallback:** **Gemini** first; on failure, **OpenAI** via `openai-fallback.ts`. Require **`OPENAI_API_KEY`** in production; test end-to-end.
- [x] **Cost monitoring:** Log provider per conversion in admin; tune prompts/models for cost vs quality.

---

## Auth (Clerk)

- [x] **OAuth:** Enable **Google** and **Facebook**; production redirect URLs.
- [x] **Email/password:** Enabled.

---

## Observability & quality

- [x] **Vercel Analytics:** Primary analytics (no Sentry). Remove lingering **Sentry** references in **PRD** / internal docs when edited.
- [x] **E2E / CI:** Expand Playwright; GitHub Actions (lint, test, optional e2e).
- [x] **`GET /api/health`:** **Add** for uptime monitoring (confirm returns OK when app + critical env are present).

---

## SEO & discoverability

- [x] **`sitemap.xml`:** Generate sitemap (Next.js Metadata Route Handler or static) listing public URLs: home, pricing, FAQ, terms, privacy, cookies, sign-in/up as appropriate.
- [x] **`robots.txt`:** Allow indexing of marketing pages; disallow `/dashboard`, `/api`, admin, webhooks.
- [x] **Per-page metadata:** Unique `<title>` and `description` for main marketing routes; Open Graph (`og:title`, `og:description`, `og:image`) and Twitter card tags for link previews.
- [x] **Canonical URLs:** Set canonical on marketing pages to avoid duplicate-content issues (e.g. with/without trailing slash, `www` vs apex) — match production host in `NEXT_PUBLIC_APP_URL`.
- [x] **Structured data (optional):** `Organization` or `WebSite` JSON-LD on homepage if you want rich results; low priority vs sitemap + metadata.
- [x] **Performance:** Core Web Vitals-friendly images (Next/Image where applicable); affects SEO indirectly.

---

## Technical cleanup (codebase & docs — when implementing)

- [x] **Remove stylization:** Remove from schema, API, UI, tests, **PRD**/docs.
- [x] **Remove legacy “credits applied to book”:** Remove `credits_applied_value_cents` (and related UI); migration if columns dropped.
- [x] **Conversion partial failure:** If `saved_conversions` succeeds but book `pages` insert fails, refund credit or fix transactionally.
- [x] **`.env.example`:** `CRON_SECRET`, `LULU_WEBHOOK_SECRET`, `LULU_CONTACT_EMAIL`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OPS_ALERT_EMAIL`, support/public email vars (`NEXT_PUBLIC_SUPPORT_EMAIL`, etc.).
- [x] **Rate limits:** In-memory limits per PRD (optional durable/shared store deferred).
- [x] **`/api/config`:** **Gate behind admin** only; do not expose sandbox/test flags to anonymous clients.

---

## Smaller / polish

- [x] **Security headers:** Review `next.config` headers (HSTS on HTTPS, frame options, referrer policy).

---

## Non-code / operations

- [x] Legal review of Terms / Privacy / Cookies (USA + Canada; refund stance including **technical auto-refund**; Lulu alignment).
- [x] Stripe account live-ready; Lulu production API access confirmed.
- [x] **Supabase:** Backups; service role never exposed to clients.
- [x] **Retention policy:** Finalize written policy (6 months vs tax rules vs cron behavior) and implement cleanup schedules.
