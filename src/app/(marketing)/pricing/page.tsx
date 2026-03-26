import Link from "next/link";
import { Check } from "lucide-react";
import { SHIPPING_LEVELS } from "@/lib/pricing";
import type { PageTier, TrimSizeId } from "@/lib/book-products";
import {
  BOOK_PRODUCTS,
  PAGE_TIERS,
  TRIM_SIZES,
} from "@/lib/book-products";
import { getCachedMarketingBookPriceMatrix } from "@/lib/marketing-book-prices";

const CREDIT_PACKS = [
  {
    name: "1–49 credits",
    price: "$0.99 each",
    perCredit: "$0.99 per conversion",
    description:
      "Choose how many you need (1–49). Perfect for trying a few conversions.",
    features: [
      "Quantity selector at checkout",
      "Download or print",
      "Saved to your library",
    ],
  },
  {
    name: "50 credits",
    price: "$24.99",
    perCredit: "$0.50 per conversion · Save 50%",
    description: "Enough for a few books or lots of one-off prints.",
    features: [
      "50 coloring pages",
      "Best for 1–2 books or classroom use",
      "Credits never expire",
    ],
    popular: true,
  },
  {
    name: "100 credits",
    price: "$39.99",
    perCredit: "$0.40 per conversion · Save 60%",
    description: "Best value for multiple books or heavy use.",
    features: [
      "100 coloring pages",
      "Best for several books or sharing",
      "Lowest per-credit price",
    ],
  },
];

export default async function PricingPage() {
  let priceMatrix: Record<TrimSizeId, Record<PageTier, number>> | null = null;
  let bookPricesError: string | null = null;
  try {
    priceMatrix = await getCachedMarketingBookPriceMatrix();
  } catch {
    bookPricesError =
      "Printed book prices are temporarily unavailable. Try reloading the page or contact support.";
  }

  return (
    <div className="container min-h-screen px-4 py-16">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Home
      </Link>
      <h1 className="font-heading mt-6 text-3xl font-bold text-foreground md:text-4xl">
        Pricing
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        One credit equals one photo converted into a coloring page. New accounts
        get 3 free credits—no card required. Buy more credits in the packages
        below when you need them.
      </p>

      <h2 className="font-heading mt-12 text-xl font-semibold text-foreground">
        Conversion credits
      </h2>
      <div className="mt-6 grid gap-8 md:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.name}
            className={`relative rounded-2xl border bg-card p-6 shadow-sm ${
              pack.popular
                ? "border-primary ring-1 ring-primary/20"
                : "border-border"
            }`}
          >
            {pack.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <p className="font-heading text-lg font-semibold text-foreground">
              {pack.name}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {pack.price}
            </p>
            <p className="text-sm text-muted-foreground">{pack.perCredit}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {pack.description}
            </p>
            <ul className="mt-4 space-y-2">
              {pack.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-primary mt-0.5"
                    aria-hidden
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 md:p-8">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Printed coloring books
        </h2>
        <p className="mt-3 text-muted-foreground">
          Each page = one image. Books are printed double-sided. Book price
          depends on size and page count; shipping is calculated at checkout.
        </p>
        {bookPricesError ? (
          <p
            className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {bookPricesError}
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 font-semibold text-foreground">Size</th>
                  {PAGE_TIERS.map((tier) => (
                    <th
                      key={tier}
                      className="pb-2 font-medium text-muted-foreground"
                    >
                      {tier} pages
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRIM_SIZES.map((trimId: TrimSizeId) => {
                  const product = BOOK_PRODUCTS[trimId];
                  const row = priceMatrix![trimId];
                  const label = product
                    ? `${product.label} (${product.widthInches}" × ${product.heightInches}")`
                    : trimId;
                  return (
                    <tr key={trimId} className="border-b border-border/70">
                      <td className="py-3 font-medium text-foreground">
                        {label}
                      </td>
                      {PAGE_TIERS.map((tier) => (
                        <td key={tier} className="py-3 text-muted-foreground">
                          ${Math.round(row[tier] / 100)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Shipping is added at checkout and depends on service level (e.g.
          Standard {SHIPPING_LEVELS[0]?.days} days, Priority{" "}
          {SHIPPING_LEVELS[1]?.days} days). Create a book to see your exact
          total.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Book prices reflect live print costs plus our margin; figures refresh
          about every hour on this page.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check
              className="h-4 w-4 shrink-0 text-primary mt-0.5"
              aria-hidden
            />
            Each page = one image; books are printed double-sided
          </li>
          <li className="flex items-start gap-2">
            <Check
              className="h-4 w-4 shrink-0 text-primary mt-0.5"
              aria-hidden
            />
            Preview your book and see the live price before ordering
          </li>
          <li className="flex items-start gap-2">
            <Check
              className="h-4 w-4 shrink-0 text-primary mt-0.5"
              aria-hidden
            />
            Secure payment via Stripe; we print and ship on demand
          </li>
        </ul>
      </div>

      <p className="mt-10">
        <Link
          href="/sign-up"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get started — 3 free credits →
        </Link>
      </p>
    </div>
  );
}
