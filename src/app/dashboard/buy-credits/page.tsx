"use client";

import { useState } from "react";
import Link from "next/link";

const PACKAGES = [
  { id: "single" as const, credits: 1, price: 0.25, label: "1 credit" },
  { id: "pack_50" as const, credits: 50, price: 10, perCredit: "0.20" },
  { id: "pack_100" as const, credits: 100, price: 15, perCredit: "0.15" },
];

export default function BuyCreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (packageType: "single" | "pack_50" | "pack_100") => {
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
          Use credits to convert photos to coloring pages. More credits = lower
          per-credit price.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="font-heading text-lg font-semibold text-foreground">
              {pkg.credits} credit{pkg.credits > 1 ? "s" : ""}
            </p>
            <p className="mt-2 text-2xl font-bold text-primary">
              ${pkg.price.toFixed(2)}
            </p>
            {pkg.perCredit && (
              <p className="text-sm text-muted-foreground">
                ${pkg.perCredit}/credit
              </p>
            )}
            <button
              type="button"
              onClick={() => handleBuy(pkg.id)}
              disabled={loading !== null}
              className="mt-6 w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading === pkg.id ? "Redirecting..." : "Buy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
