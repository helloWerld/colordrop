"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShippingLevelId } from "@/lib/pricing";
import {
  CA_PROVINCE_OPTIONS,
  SHIPPING_COUNTRIES,
  US_STATE_OPTIONS,
} from "@/lib/shipping-regions";
import { shippingAddressSchema } from "@/lib/validators";
import { LoadingSpinner } from "@/components/loading-spinner";
import { UploadConsentCheckbox } from "@/components/upload-consent-checkbox";
import { getCustomerBindingLabel } from "@/lib/book-products";
import { formatCustomerUsdWholeDollarsFromCents } from "@/lib/customer-price-display";

type ShippingOption = {
  id: ShippingLevelId;
  label: string;
  days: string;
};

type LevelQuote = {
  bookCents: number;
  shippingCents: number;
  totalCents: number;
};

function buildAddressQuoteKey(f: {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}): string {
  return JSON.stringify({
    name: f.name.trim(),
    line1: f.line1.trim(),
    line2: f.line2.trim(),
    city: f.city.trim(),
    state: f.state.trim(),
    postal_code: f.postal_code.trim(),
    country: f.country,
    phone: f.phone.trim(),
  });
}

function shippingBody(
  level: ShippingLevelId,
  f: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone: string;
  },
) {
  const base = {
    shipping_level: level,
    name: f.name.trim(),
    line1: f.line1.trim(),
    city: f.city.trim(),
    state: f.state.trim(),
    postal_code: f.postal_code.trim(),
    country: f.country,
    phone: f.phone.trim(),
  };
  const line2 = f.line2.trim();
  return line2 ? { ...base, line2 } : base;
}

export function CheckoutForm({
  bookId,
  bookTitle,
  bookSizeLabel,
  pageCount,
  pageTier,
  luluSandbox,
  shippingOptions,
}: {
  bookId: string;
  bookTitle: string;
  bookSizeLabel: string;
  pageCount: number;
  pageTier: number;
  luluSandbox: boolean;
  shippingOptions: ShippingOption[];
}) {
  const [shippingLevel, setShippingLevel] = useState<ShippingLevelId>("MAIL");
  const [shippingQuotesByLevel, setShippingQuotesByLevel] = useState<
    Record<ShippingLevelId, LevelQuote> | null
  >(null);
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
  const [priceFetchError, setPriceFetchError] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [matchedAddressQuoteKey, setMatchedAddressQuoteKey] = useState<
    string | null
  >(null);

  const addressComplete = useMemo(() => {
    return shippingAddressSchema.safeParse({
      name: form.name.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country,
      phone: form.phone.trim(),
    }).success;
  }, [
    form.name,
    form.line1,
    form.line2,
    form.city,
    form.state,
    form.postal_code,
    form.country,
    form.phone,
  ]);

  const currentAddressQuoteKey = useMemo(
    () => buildAddressQuoteKey(form),
    [
      form.name,
      form.line1,
      form.line2,
      form.city,
      form.state,
      form.postal_code,
      form.country,
      form.phone,
    ],
  );

  const price = useMemo((): LevelQuote => {
    if (!shippingQuotesByLevel) {
      return { bookCents: 0, shippingCents: 0, totalCents: 0 };
    }
    return (
      shippingQuotesByLevel[shippingLevel] ?? {
        bookCents: 0,
        shippingCents: 0,
        totalCents: 0,
      }
    );
  }, [shippingQuotesByLevel, shippingLevel]);

  const quotesAddressInSync =
    matchedAddressQuoteKey !== null &&
    matchedAddressQuoteKey === currentAddressQuoteKey &&
    shippingQuotesByLevel !== null;

  const showPricing =
    addressComplete &&
    quotesAddressInSync &&
    !priceLoading &&
    price.totalCents > 0;

  useEffect(() => {
    if (!addressComplete) {
      setMatchedAddressQuoteKey(null);
      setShippingQuotesByLevel(null);
      setPriceFetchError(null);
      setPriceLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPriceLoading(true);
      setPriceFetchError(null);
      try {
        const res = await fetch(`/api/books/${bookId}/price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // shipping_level only selects which top-level cents mirror; all tiers return in shipping_quotes.
          body: JSON.stringify(shippingBody("MAIL", form)),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.shipping_quotes) {
          setShippingQuotesByLevel(data.shipping_quotes);
          setMatchedAddressQuoteKey(buildAddressQuoteKey(form));
        } else {
          setShippingQuotesByLevel(null);
          setMatchedAddressQuoteKey(null);
          setPriceFetchError(
            data.error ??
              "Could not get a shipping quote. Try again or contact support.",
          );
        }
      } catch {
        if (!cancelled) {
          setShippingQuotesByLevel(null);
          setMatchedAddressQuoteKey(null);
          setPriceFetchError(
            "Could not get a shipping quote. Try again or contact support.",
          );
        }
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    addressComplete,
    bookId,
    form.name,
    form.line1,
    form.line2,
    form.city,
    form.state,
    form.postal_code,
    form.country,
    form.phone,
  ]);

  const handleShippingChange = (level: ShippingLevelId) => {
    setShippingLevel(level);
  };

  const refetchQuote = () => {
    if (!addressComplete) return;
    setPriceLoading(true);
    setPriceFetchError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/books/${bookId}/price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shippingBody("MAIL", form)),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.shipping_quotes) {
          setShippingQuotesByLevel(data.shipping_quotes);
          setMatchedAddressQuoteKey(buildAddressQuoteKey(form));
        } else {
          setShippingQuotesByLevel(null);
          setMatchedAddressQuoteKey(null);
          setPriceFetchError(
            data.error ??
              "Could not get a shipping quote. Try again or contact support.",
          );
        }
      } catch {
        setShippingQuotesByLevel(null);
        setMatchedAddressQuoteKey(null);
        setPriceFetchError(
          "Could not get a shipping quote. Try again or contact support.",
        );
      } finally {
        setPriceLoading(false);
      }
    })();
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
          shipping: {
            name: form.name.trim(),
            line1: form.line1.trim(),
            ...(form.line2.trim() ? { line2: form.line2.trim() } : {}),
            city: form.city.trim(),
            state: form.state.trim(),
            postal_code: form.postal_code.trim(),
            country: form.country,
            phone: form.phone.trim(),
          },
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
    addressComplete &&
    showPricing &&
    confirmRights &&
    !priceFetchError &&
    !priceLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">
          Shipping address
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We ship printed books to the <strong>United States</strong> and{" "}
          <strong>Canada</strong> only.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">
              Address
            </label>
            <input
              type="text"
              required
              value={form.line1}
              onChange={(e) =>
                setForm((f) => ({ ...f, line1: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Street address"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              value={form.line2}
              onChange={(e) =>
                setForm((f) => ({ ...f, line2: e.target.value }))
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Apt, suite, etc. (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              City
            </label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              {form.country === "CA" ? "Province / territory" : "State"}
            </label>
            <select
              required
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">
                {form.country === "CA"
                  ? "Select province or territory"
                  : "Select state"}
              </option>
              {(form.country === "CA"
                ? CA_PROVINCE_OPTIONS
                : US_STATE_OPTIONS
              ).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Postal code
            </label>
            <input
              type="text"
              required
              value={form.postal_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, postal_code: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Country
            </label>
            <select
              required
              value={form.country}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  country: e.target.value,
                  state: "",
                }))
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-foreground">
              Phone
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-semibold text-foreground">
          Shipping method
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {addressComplete
            ? "Each option shows your quoted shipping for this address. The order summary below shows book, shipping, and total for your selected method."
            : "Enter your full shipping address to see shipping options and prices."}
        </p>
        <div className="mt-4 space-y-2">
          {shippingOptions.map((opt) => {
            const q = shippingQuotesByLevel?.[opt.id];
            const showRowPrice =
              quotesAddressInSync &&
              !priceLoading &&
              q &&
              q.totalCents > 0;
            return (
              <label
                key={opt.id}
                className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingLevel === opt.id}
                    onChange={() => handleShippingChange(opt.id)}
                  />
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {opt.days} days
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-foreground tabular-nums">
                  {showRowPrice
                    ? formatCustomerUsdWholeDollarsFromCents(q.shippingCents)
                    : "—"}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading font-bold text-foreground text-lg">
          Order summary
        </h2>
        <div>
          <p className="mt-1 text-sm font-medium text-foreground">
            {bookTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {bookSizeLabel} · {pageCount} images ({pageCount / 2} double-sided
            pages)
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {getCustomerBindingLabel(pageTier)}
          </p>
        </div>
        {!addressComplete && (
          <p className="mt-4 text-sm font-semibold text-destructive border border-destructive rounded-lg p-2">
            Please enter your full shipping address to see book price, shipping,
            and total.
          </p>
        )}
        {addressComplete && priceLoading && (
          <p className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" decorative />
            Getting shipping quote…
          </p>
        )}
        {priceFetchError && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-destructive" role="alert">
              {priceFetchError}
            </p>
            <button
              type="button"
              onClick={() => refetchQuote()}
              className="text-sm font-medium text-primary underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
        {showPricing && (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Book</span>
              <span>
                {formatCustomerUsdWholeDollarsFromCents(price.bookCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {formatCustomerUsdWholeDollarsFromCents(price.shippingCents)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span>Total</span>
              <span>
                {formatCustomerUsdWholeDollarsFromCents(price.totalCents)}
              </span>
            </div>
          </dl>
        )}

        <div className="mt-4">
          <UploadConsentCheckbox
            id="checkout-book-images-consent"
            checked={confirmRights}
            onCheckedChange={setConfirmRights}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Note: Coloring books are printed on demand and customized just for
          you.{" "}
          <span className="font-semibold underline">All sales are final</span>.
        </p>
        {error && (
          <p className="mt-2 text-sm text-destructive font-semibold border border-destructive rounded-lg p-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!valid || loading}
          className="mt-6 w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Redirecting to payment…" : "Pay with Stripe"}
        </button>
      </div>
      {luluSandbox && (
        <p className="mb-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-lg p-2 border border-amber-500/30 text-center">
          Sandbox mode: this order will <span className="underline">not</span>{" "}
          be printed or shipped.
        </p>
      )}
    </form>
  );
}
