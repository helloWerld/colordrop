import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { sendOpsAlert } from "@/lib/email";
import { logIntegrationEvent } from "@/lib/integration-events";

const LOG_PREFIX = "[stripe-webhook] book_order";

export async function resolveCheckoutPaymentIntentId(
  stripe: Stripe,
  sessionId: string,
  hint: string | null,
): Promise<string | null> {
  if (hint) return hint;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const pi = s.payment_intent;
    if (typeof pi === "string") return pi;
    if (pi && typeof pi === "object" && "id" in pi) return pi.id;
  } catch (e) {
    console.error(`${LOG_PREFIX} retrieve session for payment_intent failed`, {
      sessionId,
      error: e,
    });
  }
  return null;
}

export function isAlreadyRefundedError(e: unknown): boolean {
  const err = e as { code?: string; message?: string };
  const m = err.message ?? "";
  return (
    err.code === "charge_already_refunded" ||
    m.includes("already been fully refunded") ||
    m.includes("already refunded")
  );
}

export function isAlreadyRefundedNote(refundNote: string): boolean {
  return refundNote.startsWith(
    "Refund not created: charge already refunded (idempotent).",
  );
}

/**
 * Creates a full Stripe refund for a PaymentIntent, or returns a note when
 * refund is not possible / already refunded / API error.
 */
export async function refundPaymentIntentOrNote(
  stripe: Stripe,
  paymentIntentId: string | null,
  logLabel?: string,
): Promise<{ refundId?: string; refundNote: string }> {
  if (!paymentIntentId) {
    return {
      refundNote:
        "No payment_intent; reconcile and refund manually in Stripe Dashboard if needed.",
    };
  }
  try {
    const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
    return { refundId: refund.id, refundNote: "" };
  } catch (e: unknown) {
    if (isAlreadyRefundedError(e)) {
      return {
        refundNote:
          "Refund not created: charge already refunded (idempotent).",
      };
    }
    console.error(`${logLabel ?? "[refund]"} Stripe refund failed`, {
      paymentIntentId,
      error: e,
    });
    return {
      refundNote: `Refund API error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

function buildOpsAlertBody(parts: {
  sessionId: string;
  bookId: string;
  userId: string;
  orderErr: { message: string; code?: string; details?: string } | null;
  reason: string;
  refundId?: string;
  refundNote: string;
  existingOrderId?: string;
  existingSessionId?: string | null;
}): string {
  const lines = [
    "Book order insert failed after checkout.session.completed (payment succeeded).",
    "",
    `Reason: ${parts.reason}`,
    "",
    `checkout_session_id: ${parts.sessionId}`,
    `book_id: ${parts.bookId}`,
    `user_id: ${parts.userId}`,
    parts.existingOrderId
      ? `existing_order_id: ${parts.existingOrderId}`
      : null,
    parts.existingSessionId !== undefined
      ? `existing_stripe_checkout_session_id: ${parts.existingSessionId ?? "(null)"}`
      : null,
    "",
    "Insert error:",
    parts.orderErr
      ? `  code: ${parts.orderErr.code ?? "(none)"}\n  message: ${parts.orderErr.message}\n  details: ${parts.orderErr.details ?? "(none)"}`
      : "  (none)",
    "",
    parts.refundId
      ? `Stripe refund created: ${parts.refundId}`
      : `Refund: ${parts.refundNote}`,
  ];
  return lines.filter((x) => x !== null).join("\n");
}

/**
 * After a failed `orders` insert for a paid book checkout: reconcile by book_id,
 * refund if this session cannot be matched to the order row, and alert ops.
 */
export async function handleBookOrderInsertFailure(
  stripe: Stripe,
  supabase: SupabaseClient,
  params: {
    sessionId: string;
    bookId: string;
    userId: string;
    orderErr: { message: string; code?: string; details?: string } | null;
    stripePaymentIntentId: string | null;
  },
): Promise<void> {
  const { sessionId, bookId, userId, orderErr, stripePaymentIntentId } = params;

  console.error(`${LOG_PREFIX} insert failed`, {
    sessionId,
    bookId,
    userId,
    orderError: orderErr?.message,
    orderErrorCode: orderErr?.code,
  });

  const { data: orderForBook } = await supabase
    .from("orders")
    .select("id, stripe_checkout_session_id")
    .eq("book_id", bookId)
    .maybeSingle();

  if (orderForBook?.stripe_checkout_session_id === sessionId) {
    console.error(
      `${LOG_PREFIX} reconcile: order already linked to this session (idempotent)`,
      { orderId: orderForBook.id, sessionId },
    );
    return;
  }

  const piId = await resolveCheckoutPaymentIntentId(
    stripe,
    sessionId,
    stripePaymentIntentId,
  );

  const { refundId, refundNote } = await refundPaymentIntentOrNote(
    stripe,
    piId,
    LOG_PREFIX,
  );
  await logIntegrationEvent(
    {
      provider: "stripe",
      eventType: "book_order.insert_failure_reconciled",
      severity: "error",
      status: refundId ? "refunded" : "manual_review",
      bookId,
      stripeSessionId: sessionId,
      stripePaymentIntentId: piId,
      errorCode: orderErr?.code ?? null,
      errorMessage: orderErr?.message ?? null,
      payload: { refundId: refundId ?? null, refundNote },
    },
    supabase,
  );

  const reason =
    orderForBook && orderForBook.stripe_checkout_session_id !== sessionId
      ? `book_id already has an order tied to a different checkout session (${orderForBook.stripe_checkout_session_id ?? "null"}).`
      : "No order row for this book; payment is not matched to an order.";

  const body = buildOpsAlertBody({
    sessionId,
    bookId,
    userId,
    orderErr,
    reason,
    refundId,
    refundNote,
    existingOrderId: orderForBook?.id,
    existingSessionId: orderForBook?.stripe_checkout_session_id,
  });

  const alertResult = await sendOpsAlert({
    subject: `[ColorDrop ops] Book order insert failed — ${sessionId.slice(0, 14)}…`,
    textBody: body,
  });
  if (!alertResult.ok) {
    console.error(`${LOG_PREFIX} ops alert email failed`, alertResult.error);
    console.error(`${LOG_PREFIX} ops alert copy:\n${body}`);
  }
}
