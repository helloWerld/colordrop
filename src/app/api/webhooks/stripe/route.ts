import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { enqueueBookOrderFulfillmentAfter } from "@/lib/book-order-fulfillment-after";
import { shouldEnqueueFulfillment } from "@/lib/book-order-fulfillment-gate";
import { handleBookOrderInsertFailure } from "@/lib/stripe-book-order-webhook";
import { buildPrintSnapshotFromDb } from "@/lib/print-snapshot";
import { logIntegrationEvent } from "@/lib/integration-events";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let secret: string;
  try {
    secret = getStripeWebhookSecret();
  } catch (e) {
    console.error("Stripe webhook secret not configured", e);
    return NextResponse.json(
      { error: "Webhook signing secret not configured" },
      { status: 500 },
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error("Stripe API key not configured", e);
    return NextResponse.json(
      { error: "Stripe API not configured" },
      { status: 500 },
    );
  }
  let event: {
    type: string;
    data: { object: { id?: string; metadata?: Record<string, string> } };
  };
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret) as typeof event;
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    await logIntegrationEvent({
      provider: "stripe",
      eventType: "webhook.signature_failed",
      severity: "error",
      status: "rejected",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      amount_total?: number | null;
      payment_intent?: string | { id: string } | null;
      metadata?: Record<string, string>;
    };
    const paymentIntentRaw = session.payment_intent;
    const stripePaymentIntentId =
      typeof paymentIntentRaw === "string"
        ? paymentIntentRaw
        : paymentIntentRaw &&
            typeof paymentIntentRaw === "object" &&
            "id" in paymentIntentRaw
          ? paymentIntentRaw.id
          : null;
    const meta = session.metadata ?? {};
    const supabase = createServerSupabaseClient();
    await logIntegrationEvent(
      {
        provider: "stripe",
        eventType: "checkout.session.completed.received",
        severity: "info",
        status: "received",
        bookId: meta.bookId ?? null,
        stripeSessionId: session.id,
        stripePaymentIntentId,
        payload: { type: meta.type ?? null },
      },
      supabase,
    );

    if (meta.type === "credit_purchase" && meta.userId && meta.package_type) {
      const { data: existing } = await supabase
        .from("credit_transactions")
        .select("id")
        .eq("reference_id", session.id)
        .single();
      if (existing) {
        return NextResponse.json({ received: true });
      }
      let qty: number;
      if (meta.package_type === "single") {
        qty = Math.min(
          49,
          Math.max(1, parseInt(meta.credit_quantity ?? "1", 10) || 1),
        );
      } else if (meta.package_type === "pack_50") {
        qty = 50;
      } else {
        qty = 100;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, paid_credits")
        .eq("user_id", meta.userId)
        .single();
      if (profile) {
        const current = (profile.paid_credits as number | null) ?? 0;
        await supabase
          .from("user_profiles")
          .update({
            paid_credits: current + qty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
        await supabase.from("credit_transactions").insert({
          user_id: meta.userId,
          type: "purchase",
          package_type: meta.package_type,
          quantity: qty,
          reference_id: session.id,
        });
      }
    }

    if (meta.type === "book_order" && meta.bookId && meta.userId) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, lulu_print_job_id, status, amount_total")
        .eq("stripe_checkout_session_id", session.id)
        .single();
      if (existingOrder) {
        if (shouldEnqueueFulfillment(existingOrder)) {
          await logIntegrationEvent(
            {
              provider: "stripe",
              eventType: "checkout.session.completed.idempotent_fulfillment_requeued",
              severity: "info",
              status: "requeued",
              orderId: existingOrder.id,
              bookId: meta.bookId,
              stripeSessionId: session.id,
              stripePaymentIntentId,
            },
            supabase,
          );
          enqueueBookOrderFulfillmentAfter(existingOrder.id, {
            bookId: meta.bookId,
            userId: meta.userId,
            amountTotalCents: existingOrder.amount_total ?? 0,
          });
        } else {
          await logIntegrationEvent(
            {
              provider: "stripe",
              eventType: "checkout.session.completed.idempotent",
              severity: "info",
              status: "ignored",
              bookId: meta.bookId,
              stripeSessionId: session.id,
              stripePaymentIntentId,
            },
            supabase,
          );
        }
        return NextResponse.json({ received: true });
      }
      const amountTotal = session.amount_total ?? 0;

      const snapshotResult = await buildPrintSnapshotFromDb(
        supabase,
        meta.bookId,
      );
      if (!snapshotResult.ok) {
        await logIntegrationEvent(
          {
            provider: "stripe",
            eventType: "book_order.snapshot_failed",
            severity: "error",
            status: "failed",
            bookId: meta.bookId,
            stripeSessionId: session.id,
            stripePaymentIntentId,
            errorMessage: snapshotResult.error,
          },
          supabase,
        );
        await handleBookOrderInsertFailure(stripe, supabase, {
          sessionId: session.id,
          bookId: meta.bookId,
          userId: meta.userId,
          orderErr: {
            message: `Print snapshot failed: ${snapshotResult.error}`,
          },
          stripePaymentIntentId,
        });
        return NextResponse.json({ received: true });
      }

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          book_id: meta.bookId,
          user_id: meta.userId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: stripePaymentIntentId,
          amount_total: amountTotal,
          currency: "usd",
          shipping_name: meta.shipping_name ?? "",
          shipping_address_line1: meta.shipping_line1 ?? "",
          shipping_address_line2: meta.shipping_line2 || null,
          shipping_city: meta.shipping_city ?? "",
          shipping_state: meta.shipping_state ?? "",
          shipping_postal_code: meta.shipping_postal_code ?? "",
          shipping_country: meta.shipping_country ?? "",
          shipping_phone: meta.shipping_phone ?? "",
          shipping_level: meta.shipping_level ?? "MAIL",
          status: "paid",
          print_snapshot: snapshotResult.snapshot,
        })
        .select("id")
        .single();
      if (!orderErr && order) {
        await logIntegrationEvent(
          {
            provider: "stripe",
            eventType: "book_order.created",
            severity: "info",
            status: "success",
            orderId: order.id,
            bookId: meta.bookId,
            stripeSessionId: session.id,
            stripePaymentIntentId,
          },
          supabase,
        );
        await supabase
          .from("books")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", meta.bookId);
        enqueueBookOrderFulfillmentAfter(order.id, {
          bookId: meta.bookId,
          userId: meta.userId,
          amountTotalCents: amountTotal,
        });
      } else {
        await logIntegrationEvent(
          {
            provider: "stripe",
            eventType: "book_order.insert_failed",
            severity: "error",
            status: "failed",
            bookId: meta.bookId,
            stripeSessionId: session.id,
            stripePaymentIntentId,
            errorCode: orderErr?.code ?? null,
            errorMessage:
              orderErr?.message ?? "Insert returned no row without PostgREST error",
          },
          supabase,
        );
        await handleBookOrderInsertFailure(stripe, supabase, {
          sessionId: session.id,
          bookId: meta.bookId,
          userId: meta.userId,
          orderErr: orderErr
            ? {
                message: orderErr.message,
                code: orderErr.code,
                details: orderErr.details,
              }
            : { message: "Insert returned no row without PostgREST error" },
          stripePaymentIntentId,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
