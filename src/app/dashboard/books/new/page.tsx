"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BOOK_PRODUCTS,
  getCustomerBindingLabel,
  PAGE_TIERS_PERFECT_BOUND,
  PAGE_TIERS_STAPLED,
  TRIM_SIZES,
} from "@/lib/book-products";
import type { TrimSizeId } from "@/lib/book-products";
import { formatCustomerUsdWholeDollarsFromCents } from "@/lib/customer-price-display";

export default function NewBookPage() {
  const router = useRouter();
  const [trimSizeId, setTrimSizeId] = useState<TrimSizeId>("large");
  const [pageTier, setPageTier] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingAtCents, setStartingAtCents] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPrice(true);
    setPriceError(null);
    fetch(
      `/api/price?trim_size_id=${encodeURIComponent(trimSizeId)}&page_tier=${pageTier}&shipping_level=MAIL`,
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.printingOnlyCents != null) {
          setStartingAtCents(data.printingOnlyCents);
          setPriceError(null);
        } else {
          setStartingAtCents(null);
          setPriceError(
            data.error ??
              "Pricing is temporarily unavailable. Try reloading the page or contact support.",
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStartingAtCents(null);
          setPriceError(
            "Pricing is temporarily unavailable. Try reloading the page or contact support.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPrice(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trimSizeId, pageTier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trim_size_id: trimSizeId,
          page_tier: pageTier,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to create book");
        return;
      }
      if (data.book?.id) {
        router.replace(`/dashboard/books/${data.book.id}`);
      } else {
        setError("Invalid response");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Create a Book
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose size and number of pages. You can name your book in the editor.
          Each page is one image (one coloring page). Books are printed
          double-sided.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-medium text-foreground">Book size</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the physical size of your book. For best print quality, use
            images at least the recommended size.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {TRIM_SIZES.map((id) => {
              const p = BOOK_PRODUCTS[id];
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors ${
                    trimSizeId === id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="trim"
                    value={id}
                    checked={trimSizeId === id}
                    onChange={() => setTrimSizeId(id)}
                    className="sr-only"
                  />
                  <span className="font-medium text-foreground">{p.label}</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {`${p.widthInches}" × ${p.heightInches}"`}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    Min image: {p.recommendedMinWidthPx}×
                    {p.recommendedMinHeightPx} px
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-medium text-foreground">Number of images</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Books are printed double-sided (e.g. 12 images = 6 physical sheets)
          </p>
          <div className="mt-4 space-y-5">
            {(
              [
                {
                  title: "Stapled binding",
                  subtitle: "Up to 48 images",
                  tiers: PAGE_TIERS_STAPLED,
                },
                {
                  title: "Perfect-bound (paperback spine)",
                  subtitle: "64 images or more",
                  tiers: PAGE_TIERS_PERFECT_BOUND,
                },
              ] as const
            ).map((group) => (
              <div key={group.title}>
                <p className="text-sm font-medium text-foreground">
                  {group.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.subtitle}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.tiers.map((tier) => (
                    <label
                      key={tier}
                      className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                        pageTier === tier
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="page_tier"
                        value={tier}
                        checked={pageTier === tier}
                        onChange={() => setPageTier(tier)}
                        className="sr-only"
                      />
                      <span>{tier} images</span>
                      <span
                        className={
                          pageTier === tier
                            ? "text-xs text-muted-foreground"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        ({tier / 2} sheets)
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className=" space-y-1">
            <p className="text-xl font-medium text-foreground">
              {loadingPrice
                ? "Calculating price…"
                : startingAtCents != null
                  ? `Printing and binding: ${formatCustomerUsdWholeDollarsFromCents(startingAtCents)}`
                  : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Printing and binding only; shipping is quoted separately at
              checkout.
            </p>
            {priceError && !loadingPrice && (
              <p className="text-sm text-destructive" role="alert">
                {priceError}
              </p>
            )}
            <p className="text-sm text-muted-foreground pt-4">
              Current Selection:
            </p>
            <div className="text-sm text-foreground capitalize p-2  px-4 bg-primary/5 rounded-lg border border-primary w-full flex flex-col md:flex-row items-start justify-between gap-2">
              <p className="whitespace-nowrap">
                <span className="font-medium">Page Size:</span>{" "}
                {BOOK_PRODUCTS[trimSizeId].label} (
                {`${BOOK_PRODUCTS[trimSizeId].widthInches}" × ${BOOK_PRODUCTS[trimSizeId].heightInches}"`})
              </p>
              <p className="whitespace-nowrap">
                <span className="font-medium">Page Tier:</span> {pageTier}{" "}
                images ({pageTier / 2} sheets)
              </p>
              <p className="whitespace-nowrap">
                <span className="font-medium">Binding:</span>{" "}
                {getCustomerBindingLabel(pageTier)}
              </p>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Opening editor…" : "Build Your Coloring Book →"}
        </button>
      </form>
    </div>
  );
}
