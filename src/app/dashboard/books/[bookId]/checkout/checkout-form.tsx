"use client";

import { useState } from "react";
import type { ShippingLevelId } from "@/lib/pricing";

type ShippingOption = { id: ShippingLevelId; label: string; days: string; cents: number };

export function CheckoutForm({
  bookId,
  bookTitle,
  pageCount,
  defaultBreakdown,
  shippingOptions,
}: {
  bookId: string;
  bookTitle: string;
  pageCount: number;
  defaultBreakdown: { subtotalCents: number; shippingCents: number; creditsCents: number; totalCents: number };
  shippingOptions: ShippingOption[];
}) {
  const [shippingLevel, setShippingLevel] = useState<ShippingLevelId>("MAIL");
  const [price, setPrice] = useState(defaultBreakdown);
  const [form, setForm] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePrice = async (level: ShippingLevelId) => {
    const res = await fetch(`/api/books/${bookId}/price?shipping_level=${level}`);
    if (res.ok) {
      const data = await res.json();
      setPrice({
        subtotalCents: data.subtotalCents,
        shippingCents: data.shippingCents,
        creditsCents: data.creditsCents,
        totalCents: data.totalCents,
      });
    }
  };

  const handleShippingChange = (level: ShippingLevelId) => {
    setShippingLevel(level);
    updatePrice(level);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "book",
          book_id: bookId,
          shipping: form,
          shipping_level: shippingLevel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) window.location.href = data.url;
      else throw new Error("No redirect URL");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const [confirmRights, setConfirmRights] = useState(false);
  const valid =
    form.name &&
    form.line1 &&
    form.city &&
    form.state &&
    form.postal_code &&
    form.country &&
    form.phone &&
    confirmRights;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">Shipping address</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">Address</label>
            <input
              type="text"
              required
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Street address"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              value={form.line2}
              onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Apt, suite, etc. (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">City</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">State</label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Postal code</label>
            <input
              type="text"
              required
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Country</label>
            <select
              required
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">Phone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">Shipping method</h2>
        <div className="mt-4 space-y-2">
          {shippingOptions.map((opt) => (
            <label key={opt.id} className="flex cursor-pointer items-center gap-4 rounded-lg border border-border p-3">
              <input
                type="radio"
                name="shipping"
                checked={shippingLevel === opt.id}
                onChange={() => handleShippingChange(opt.id)}
              />
              <span className="font-medium">{opt.label}</span>
              <span className="text-sm text-muted-foreground">{opt.days} days</span>
              <span className="ml-auto">${(opt.cents / 100).toFixed(2)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">Order summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">{bookTitle} · {pageCount} pages</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${(price.subtotalCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>${(price.shippingCents / 100).toFixed(2)}</span>
          </div>
          {price.creditsCents > 0 && (
            <div className="flex justify-between text-primary">
              <span>Credits applied</span>
              <span>-${(price.creditsCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <span>Total</span>
            <span>${(price.totalCents / 100).toFixed(2)}</span>
          </div>
        </dl>
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            required
            checked={confirmRights}
            onChange={(e) => setConfirmRights(e.target.checked)}
            className="mt-1 rounded border-input"
          />
          <span className="text-sm text-muted-foreground">
            I confirm I have the right to use these images (e.g. I own them or have permission).
          </span>
        </label>
        <p className="mt-4 text-xs text-muted-foreground">
          Coloring books are printed on demand and customized just for you. All sales are final.
        </p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={!valid || loading}
          className="mt-6 w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Redirecting to payment…" : "Pay with Stripe"}
        </button>
      </div>
    </form>
  );
}
