"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  amount_total: number;
  status: string;
  created_at: string;
  credits_applied_value_cents: number;
} | null;

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<Order>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (data.order) {
        setOrder(data.order);
        setLoading(false);
        return;
      }
      setTimeout(poll, 1500);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">Missing session. Did you complete checkout?</p>
        <Link href="/dashboard" className="mt-4 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">Processing your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container flex min-h-[50vh] flex-col items-center justify-center px-4">
        <p className="text-muted-foreground">We couldn’t find your order. It may still be processing.</p>
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
        You paid ${((order.amount_total ?? 0) / 100).toFixed(2)}
      </p>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Estimated delivery: 7–14 business days (standard shipping).
      </p>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        We’ll email you tracking info when your book ships.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/dashboard/books/new"
          className="rounded-full border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Make Another Book
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="container flex min-h-[50vh] items-center justify-center px-4 text-muted-foreground">Loading…</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
