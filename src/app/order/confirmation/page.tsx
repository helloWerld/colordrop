"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { getPublicSupportEmail } from "@/lib/support-contact";
import {
  isOrderFulfillmentFailed,
  isOrderPrintSubmitted,
  shouldEnqueueFulfillment,
} from "@/lib/book-order-fulfillment-gate";

const POLL_MS = 1500;
const SLOW_AFTER_MS = 12_000;
const TIMEOUT_MS = 180_000;
const POLL_FETCH_MS = 20_000;

type Order = {
  id: string;
  amount_total: number;
  status: string;
  created_at: string;
  lulu_print_job_id: number | null;
  error_message: string | null;
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
    let orderResolved = false;
    let stopPoll = false;
    const started = Date.now();

    const tick = setInterval(() => {
      if (cancelled) return;
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);

    const overallTimer = setTimeout(() => {
      if (cancelled || orderResolved) return;
      stopPoll = true;
      setTimedOut(true);
      setLoading(false);
    }, TIMEOUT_MS);

    const poll = async () => {
      if (cancelled || orderResolved) return;
      if (stopPoll) return;
      try {
        const res = await fetch(
          `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`,
          { signal: AbortSignal.timeout(POLL_FETCH_MS) },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.order) {
          const nextOrder = data.order as NonNullable<Order>;
          setOrder(nextOrder);
          if (
            !shouldEnqueueFulfillment({
              lulu_print_job_id: nextOrder.lulu_print_job_id ?? null,
              status: nextOrder.status,
            })
          ) {
            orderResolved = true;
            stopPoll = true;
            clearTimeout(overallTimer);
            setTimedOut(false);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* keep polling */
      }

      if (cancelled || orderResolved) return;
      if (stopPoll) return;
      setTimeout(poll, POLL_MS);
    };

    poll();

    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(overallTimer);
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
    const awaitingLulu =
      order != null &&
      shouldEnqueueFulfillment({
        lulu_print_job_id: order.lulu_print_job_id,
        status: order.status,
      });
    return (
      <div className="container flex mx-auto min-h-[50vh] flex-col items-center justify-center px-4 text-center max-w-md">
        <LoadingSpinner size="lg" decorative className="text-primary" />
        <p className="mt-6 font-medium text-foreground">
          {awaitingLulu
            ? showSlowCopy
              ? "Payment received — sending your book to the printer…"
              : "Sending your book to the printer…"
            : showSlowCopy
              ? "Payment received — finalizing your order…"
              : "Processing your order…"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {awaitingLulu
            ? showSlowCopy
              ? "This step usually finishes within a minute. Large books can take a bit longer."
              : "Hang tight while we prepare your files for printing."
            : showSlowCopy
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
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4 text-center max-w-md mx-auto">
        <p className="font-medium text-foreground">
          We couldn&apos;t confirm yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your bank or receipt may already show a successful charge while we
          finish creating your order record (usually within seconds). If nothing
          appears after refreshing, check your{" "}
          <Link href="/dashboard" className="text-primary underline">
            dashboard
          </Link>{" "}
          or email{" "}
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

  if (
    timedOut &&
    order &&
    shouldEnqueueFulfillment({
      lulu_print_job_id: order.lulu_print_job_id,
      status: order.status,
    })
  ) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4 text-center max-w-md mx-auto">
        <p className="font-medium text-foreground">
          Payment received — printer handoff is taking longer than usual
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order is on file (reference #{order.id.slice(0, 8)}). Our team is
          notified when this step stalls. Check your{" "}
          <Link href="/dashboard" className="text-primary underline">
            dashboard
          </Link>{" "}
          shortly, or email{" "}
          <a className="text-primary underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>{" "}
          with that reference and we will sort it out.
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

  if (order && isOrderFulfillmentFailed(order)) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4 text-center max-w-md mx-auto">
        <p className="font-medium text-foreground">
          {order.status === "refunded"
            ? "We could not complete printing — your payment was returned"
            : "We could not complete printing for this order"}
        </p>
        {order.error_message ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {order.error_message}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">
          Questions?{" "}
          <a className="text-primary underline" href={`mailto:${supportEmail}`}>
            {supportEmail}
          </a>
        </p>
        <Link
          href="/dashboard"
          className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!order || !isOrderPrintSubmitted(order)) {
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
        Your coloring book is in the works!
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
