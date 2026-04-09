"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getPublicSupportEmail } from "@/lib/support-contact";

const POLL_MS = 1500;
const SLOW_AFTER_MS = 12_000;
const TIMEOUT_MS = 120_000;

type Order = {
  id: string;
  amount_total: number;
  status: string;
  created_at: string;
} | null;

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<Order>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [timedOut, setTimedOut] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const supportEmail = getPublicSupportEmail();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const started = Date.now();

    const tick = setInterval(() => {
      if (cancelled) return;
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.order) {
          setOrder(data.order);
          setLoading(false);
          return;
        }
      } catch {
        /* keep polling */
      }

      if (cancelled) return;
      if (Date.now() - started >= TIMEOUT_MS) {
        setTimedOut(true);
        setLoading(false);
        return;
      }
      setTimeout(poll, POLL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">
          Missing session. Did you complete checkout?
        </p>
        <Link href="/dashboard" className="mt-4 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    const showSlowCopy = elapsedSec * 1000 >= SLOW_AFTER_MS;
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4 text-center max-w-md">
        <LoadingSpinner
          size="lg"
          decorative
          className="text-primary"
        />
        <p className="mt-6 font-medium text-foreground">
          {showSlowCopy
            ? "Payment received — finalizing your order…"
            : "Processing your order…"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {showSlowCopy
            ? "This usually takes a few seconds. If our payment system is busy, it can take a little longer."
            : "Hang tight while we confirm your order."}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {elapsedSec > 0 ? `Still working… (${elapsedSec}s)` : null}
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          You can safely open your{" "}
          <Link href="/dashboard" className="text-primary underline">
            dashboard
          </Link>{" "}
          — your order will appear once processing finishes. Questions?{" "}
          <a className="text-primary underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
      </div>
    );
  }

  if (timedOut && !order) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4 text-center max-w-md">
        <p className="font-medium text-foreground">We couldn&apos;t confirm yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment may still be processing. Check your{" "}
          <Link href="/dashboard" className="text-primary underline">
            dashboard
          </Link>{" "}
          for your order, or email{" "}
          <a className="text-primary underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>{" "}
          with your checkout details. We aim to respond within 72 hours.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">
          We couldn&apos;t find your order. It may still be processing.
        </p>
        <Link href="/dashboard" className="mt-4 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="rounded-full bg-primary/20 p-4 text-4xl">✓</div>
      <h1 className="mt-6 font-heading text-2xl font-bold text-foreground">
        Your book is on its way!
      </h1>
      <p className="mt-2 text-muted-foreground">
        Order #{order.id.slice(0, 8)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        You paid ${Math.round((order.amount_total ?? 0) / 100)}
      </p>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Estimated delivery: 7–14 business days (standard shipping). We ship to
        the US and Canada only.
      </p>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        We’ll email you tracking info when your book ships.
      </p>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Need help?{" "}
        <a className="text-primary underline" href={`mailto:${supportEmail}`}>
          {supportEmail}
        </a>
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/dashboard/books/new"
          className="rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Make Another Book
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-[50vh] items-center justify-center px-4 text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
