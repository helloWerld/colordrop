"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Lock, Minus, Plus } from "lucide-react";

const SINGLE_PRICE_PER_CREDIT = 0.99;

const PACKS = [
  {
    id: "pack_50" as const,
    credits: 50,
    price: 24.99,
    perCredit: "0.50",
    savePct: "50%",
    popular: true,
    features: [
      "50 coloring pages",
      "Best for 1–2 books or classroom use",
      "Credits never expire",
    ],
  },
  {
    id: "pack_100" as const,
    credits: 100,
    price: 39.99,
    perCredit: "0.40",
    savePct: "60%",
    popular: false,
    features: [
      "100 coloring pages",
      "Lowest per-credit price",
      "Best for multiple books or sharing",
    ],
  },
];

const SINGLE_FEATURES = [
  "Pay only for what you need",
  "Download or print",
  "Saved to your library",
];

interface Props {
  freeRemaining: number;
  paidCredits: number;
}

function BuyCreditsInner({ freeRemaining, paidCredits }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPurchaseSuccess] = useState(
    () => searchParams.get("success") === "1",
  );

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      router.replace("/dashboard/buy-credits", { scroll: false });
    }
  }, [searchParams, router]);

  const [singleQuantity, setSingleQuantity] = useState(5);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuySingle = async () => {
    setError(null);
    setLoading("single");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credit",
          package_type: "single",
          quantity: singleQuantity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const handleBuyPack = async (packageType: "pack_50" | "pack_100") => {
    setError(null);
    setLoading(packageType);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "credit", package_type: packageType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
      else throw new Error("No checkout URL");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const decrement = () =>
    setSingleQuantity((q) => Math.max(1, q - 1));
  const increment = () =>
    setSingleQuantity((q) => Math.min(49, q + 1));

  const totalCredits = freeRemaining + paidCredits;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Buy Credits
        </h1>
        <p className="mt-1 text-muted-foreground">
          Use credits to convert photos to coloring pages. Buy 1–49 at $0.99
          each, or save with packs of 50 or 100.
        </p>
      </div>

      {/* Credit balance */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Your balance:</span>
        <span className="text-lg font-bold text-primary">
          {totalCredits} credit{totalCredits !== 1 ? "s" : ""}
        </span>
        {freeRemaining > 0 && paidCredits > 0 && (
          <span className="text-xs text-muted-foreground">
            ({freeRemaining} free + {paidCredits} paid)
          </span>
        )}
        {freeRemaining > 0 && paidCredits === 0 && (
          <span className="text-xs text-muted-foreground">
            ({freeRemaining} free)
          </span>
        )}
      </div>

      {showPurchaseSuccess && (
        <div
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100"
          role="status"
        >
          Payment successful — your credits have been added to your account.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Single credits card */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="font-heading text-lg font-semibold text-foreground">
            1–49 credits
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            $0.99 per conversion
          </p>

          <div className="mt-4 flex items-center gap-2">
            <label
              htmlFor="single-qty"
              className="text-sm font-medium text-foreground"
            >
              Qty
            </label>
            <div className="flex items-center rounded-lg border border-input bg-background">
              <button
                type="button"
                onClick={decrement}
                disabled={singleQuantity <= 1}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                id="single-qty"
                type="number"
                min={1}
                max={49}
                value={singleQuantity}
                onChange={(e) =>
                  setSingleQuantity(
                    Math.min(
                      49,
                      Math.max(1, parseInt(e.target.value, 10) || 1),
                    ),
                  )
                }
                className="h-9 w-12 border-x border-input bg-transparent text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={increment}
                disabled={singleQuantity >= 49}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-3 text-2xl font-bold text-primary">
            ${(singleQuantity * SINGLE_PRICE_PER_CREDIT).toFixed(2)}
          </p>

          <ul className="mt-4 flex-1 space-y-2">
            {SINGLE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                {f}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={handleBuySingle}
            disabled={loading !== null}
            className="mt-6 w-full rounded-lg border border-primary bg-transparent px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {loading === "single"
              ? "Redirecting…"
              : `Buy ${singleQuantity} Credit${singleQuantity !== 1 ? "s" : ""}`}
          </button>
        </div>

        {/* Pack cards */}
        {PACKS.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
              pkg.popular
                ? "border-primary ring-1 ring-primary/20 bg-card"
                : "border-border bg-card"
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}

            <div className="flex items-center gap-2">
              <p className="font-heading text-lg font-semibold text-foreground">
                {pkg.credits} credits
              </p>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Save {pkg.savePct}
              </span>
            </div>

            <p className="mt-2 text-2xl font-bold text-primary">
              ${pkg.price.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              ${pkg.perCredit}/credit
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {pkg.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleBuyPack(pkg.id)}
              disabled={loading !== null}
              className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                pkg.popular
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-primary bg-transparent text-primary hover:bg-primary/10"
              }`}
            >
              {loading === pkg.id
                ? "Redirecting…"
                : `Buy ${pkg.credits} Pack`}
            </button>
          </div>
        ))}
      </div>

      {/* Trust footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        <span>Secure payment via Stripe. Credits never expire.</span>
      </div>
    </div>
  );
}

export function BuyCreditsContent(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-8 text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BuyCreditsInner {...props} />
    </Suspense>
  );
}
