# ColorDrop

Turn your photos into custom printed coloring books. See [PRD.md](PRD.md) for full product spec.

## Credits & books

- **New users** get 3 free conversion credits (no card required). Each image conversion uses 1 credit.
- **Conversion credits** are for image conversions only; they cannot be applied toward book purchases.
- **Books** are paid separately: one checkout with **Book (printing & binding)** and **Shipping** as line items.
- **Saved images** are stored in your account and can be printed or downloaded at any time; you can organize them into **collections** (e.g. John's Wedding, Sam's birthday).

## Stack

Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Clerk, Supabase, Gemini (Nano Banana) + Replicate fallback for image conversion, Stripe, Lulu.

## Setup

1. Copy `.env.example` to `.env.local` and fill in keys (Clerk, Supabase, GEMINI_API_KEY and/or REPLICATE_API_TOKEN for conversion, Stripe, etc.).
2. Add `DATABASE_URL` to `.env.local`: in Supabase Dashboard → **Settings → Database**, under **Connection string** choose **Use connection pooling**, then copy the **URI** (host should be `aws-0-<region>.pooler.supabase.com`, port 6543). Do not use the direct `db.*.supabase.co` URI—it can fail with ENOTFOUND.
3. Run migrations: `npm run db:migrate` (applies `supabase/migrations/*.sql`).
3. Create Supabase Storage buckets: `originals`, `outlines`, `covers`, `pdfs`.
4. **Stripe:** Set `NEXT_PUBLIC_APP_URL` to your app origin (Checkout success/cancel URLs depend on it). You can keep **live** keys in `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` and **test** keys in `STRIPE_SANDBOX_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_SANDBOX_PUBLISHABLE_KEY` / `STRIPE_SANDBOX_WEBHOOK_SECRET`, then toggle `STRIPE_USE_SANDBOX=true` (same idea as `LULU_USE_SANDBOX`) to switch modes; restart the dev server after changing. When sandbox is off, the app uses the live env vars; webhook signature verification must use the matching signing secret (`STRIPE_WEBHOOK_SECRET` vs `STRIPE_SANDBOX_WEBHOOK_SECRET`). For **local webhooks**, run [Stripe CLI](https://stripe.com/docs/stripe-cli) `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the printed `whsec_…` into the secret for the mode you are using (it changes when you restart `listen`). If you do not use separate sandbox vars, leave `STRIPE_USE_SANDBOX` unset or `false` and use test keys only in `STRIPE_SECRET_KEY` until production. The dashboard **Stripe test mode** banner shows when `STRIPE_USE_SANDBOX=true` or when legacy key-prefix detection applies (`sk_test_` / `pk_test_`). Use [Stripe test cards](https://stripe.com/docs/testing#cards) (e.g. `4242 4242 4242 4242`) in test mode.
5. **Book pricing:** Prices are computed from Lulu's cost API plus configurable markups on print+fulfillment (`BOOK_MARKUP_PERCENT`) and on shipping (`SHIPPING_MARKUP_PERCENT`), each defaulting to `50` (50% markup on that portion of Lulu cost). Changing them requires an app restart. Optional: `LULU_COST_CALC_*` env vars override the representative US address used only for cost caching (see `.env.example`).

6. **Lulu sandbox (testing):** To test the book checkout flow without placing real print jobs, use Lulu's sandbox. Create a separate account at [developers.sandbox.lulu.com](https://developers.sandbox.lulu.com/), generate API keys there, then set `LULU_USE_SANDBOX=true`, `LULU_SANDBOX_CLIENT_KEY`, `LULU_SANDBOX_CLIENT_SECRET`, and `LULU_SANDBOX_API_BASE_URL=https://api.sandbox.lulu.com` in `.env.local`. Restart the app to switch between sandbox and production. When sandbox credentials are active, the app shows a clear banner and book orders will not be printed or shipped. If `LULU_USE_SANDBOX=true` but sandbox keys are missing, the app uses production Lulu when `LULU_CLIENT_KEY` / `LULU_CLIENT_SECRET` are set (check the server log for a one-time notice).

## Troubleshooting

- **"Could not find the table 'public.user_profiles' in the schema cache"** — The database schema has not been applied. Ensure `DATABASE_URL` in `.env.local` is the connection pooling URI for the same Supabase project as `NEXT_PUBLIC_SUPABASE_URL`, then run `npm run db:migrate`. If the error persists briefly after migrating, reload the schema cache in Supabase Dashboard (Settings → API) or wait a minute and retry.

- **Upload returns 500 or "Bucket not found"** — Create the required Storage buckets in Supabase Dashboard: **Storage** → **New bucket** → create `originals`, `outlines`, `covers`, and `pdfs` (public or with policies that allow your app to read/write). Or run `npm run storage:create-buckets`.

- **"Conversion failed" when adding a page or converting a photo** — Image conversion uses Gemini (Nano Banana) first, then Replicate as fallback. Set `GEMINI_API_KEY` in `.env.local` (from [Google AI Studio](https://aistudio.google.com/apikey)) and/or `REPLICATE_API_TOKEN` (from [replicate.com](https://replicate.com)). Check the terminal running `npm run dev` for the exact error (e.g. invalid token, rate limit, or model unavailable).

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
