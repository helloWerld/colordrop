"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const SINGLE_PRICE_PER_CREDIT = 0.99;
const PACKS = [
  { id: "pack_50" as const, credits: 50, price: 24.99, perCredit: "0.50" },
  { id: "pack_100" as const, credits: 100, price: 39.99, perCredit: "0.40" },
];

function BuyCreditsContent() {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
          Buy Credits
        </h1>
        <p className="mt-1 text-muted-foreground">
          Use credits to convert photos to coloring pages. Buy 1–49 at $0.99
          each, or save with packs of 50 or 100.
        </p>
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="font-heading text-lg font-semibold text-foreground">
            1–49 credits
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            $0.99 per conversion
          </p>
          <div className="mt-4 flex items-center gap-3">
            <label
              htmlFor="single-qty"
              className="text-sm font-medium text-foreground"
            >
              Quantity
            </label>
            <input
              id="single-qty"
              type="number"
              min={1}
              max={49}
              value={singleQuantity}
              onChange={(e) =>
                setSingleQuantity(
                  Math.min(49, Math.max(1, parseInt(e.target.value, 10) || 1)),
                )
              }
              className="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">
            ${(singleQuantity * SINGLE_PRICE_PER_CREDIT).toFixed(2)}
          </p>
          <button
            type="button"
            onClick={handleBuySingle}
            disabled={loading !== null}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading === "single" ? "Redirecting..." : "Buy"}
          </button>
        </div>
        {PACKS.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="font-heading text-lg font-semibold text-foreground">
              {pkg.credits} credits
            </p>
            <p className="mt-2 text-2xl font-bold text-primary">
              ${pkg.price.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              ${pkg.perCredit}/credit
            </p>
            <button
              type="button"
              onClick={() => handleBuyPack(pkg.id)}
              disabled={loading !== null}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading === pkg.id ? "Redirecting..." : "Buy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BuyCreditsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl py-8 text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BuyCreditsContent />
    </Suspense>
  );
}
