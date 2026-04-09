import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import {
  refundPaymentIntentOrNote,
  isAlreadyRefundedNote,
} from "@/lib/stripe-book-order-webhook";
import {
  getEmailForUserId,
  sendFulfillmentFailureCustomerEmail,
  sendOpsAlert,
} from "@/lib/email";
import { logIntegrationEvent } from "@/lib/integration-events";

export type FulfillmentFailurePhase = "pre_lulu" | "lulu";

/**
 * After payment: fulfillment cannot be completed. Attempt Stripe refund, persist state,
 * notify customer and ops. Book returns to `ordering` when payment was returned.
 */
export async function handleTerminalFulfillmentFailure(
  supabase: SupabaseClient,
  ctx: {
    orderId: string;
    bookId: string;
    userId: string;
    stripePaymentIntentId: string | null;
    bookTitle: string;
    phase: FulfillmentFailurePhase;
    errorMessage: string;
  },
): Promise<void> {
  let stripe: ReturnType<typeof getStripe> | null = null;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error("[fulfillment] getStripe failed", e);
  }

  const { refundId, refundNote } = stripe
    ? await refundPaymentIntentOrNote(
        stripe,
        ctx.stripePaymentIntentId,
        "[fulfillment]",
      )
    : { refundId: undefined as string | undefined, refundNote: "Stripe API not configured." };

  const paymentReturned =
    !!refundId || refundNote === "" || isAlreadyRefundedNote(refundNote);

  const orderStatus = paymentReturned ? "refunded" : "error";

  await supabase
    .from("orders")
    .update({
      status: orderStatus,
      error_message: ctx.errorMessage,
      stripe_refund_id: refundId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.orderId);

  await logIntegrationEvent(
    {
      provider: "system",
      eventType: "fulfillment.terminal_failure",
      severity: "error",
      status: orderStatus,
      orderId: ctx.orderId,
      bookId: ctx.bookId,
      stripePaymentIntentId: ctx.stripePaymentIntentId,
      errorMessage: ctx.errorMessage,
      payload: { phase: ctx.phase, refundId: refundId ?? null, refundNote },
    },
    supabase,
  );

  if (paymentReturned) {
    await supabase
      .from("books")
      .update({ status: "ordering", updated_at: new Date().toISOString() })
      .eq("id", ctx.bookId);
  }

  const email = await getEmailForUserId(ctx.userId);
  if (email) {
    const sent = await sendFulfillmentFailureCustomerEmail({
      to: email,
      orderShortId: ctx.orderId.slice(0, 8),
      bookTitle: ctx.bookTitle,
      paymentRefunded: paymentReturned,
    });
    if (!sent.ok) {
      console.error("[fulfillment] customer email failed", sent.error);
    }
  }

  const opsBody = [
    `Fulfillment failed (${ctx.phase}).`,
    "",
    `order_id: ${ctx.orderId}`,
    `book_id: ${ctx.bookId}`,
    `user_id: ${ctx.userId}`,
    `stripe_payment_intent_id: ${ctx.stripePaymentIntentId ?? "(null)"}`,
    "",
    "Last error:",
    ctx.errorMessage,
    "",
    refundId ? `Stripe refund id: ${refundId}` : `Refund: ${refundNote}`,
  ].join("\n");

  const alertResult = await sendOpsAlert({
    subject: `[ColorDrop ops] Fulfillment failed — order ${ctx.orderId.slice(0, 8)}…`,
    textBody: opsBody,
  });
  if (!alertResult.ok) {
    console.error("[fulfillment] ops alert failed", alertResult.error);
    console.error("[fulfillment] ops alert copy:\n", opsBody);
  }
}
