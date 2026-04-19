import { after } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { runFulfillment } from "@/lib/fulfillment";
import {
  getEmailForUserId,
  sendOrderConfirmation,
  sendOpsAlert,
} from "@/lib/email";
import { logIntegrationEvent } from "@/lib/integration-events";

type EnqueueCtx = {
  bookId: string;
  userId: string;
  amountTotalCents: number;
};

/**
 * Runs {@link runFulfillment} after the HTTP response is sent (Next.js `after`),
 * then sends the order confirmation email only when Lulu accepted the print job.
 */
export function enqueueBookOrderFulfillmentAfter(
  orderId: string,
  ctx: EnqueueCtx,
): void {
  after(async () => {
    const supabase = createServerSupabaseClient();
    try {
      const result = await runFulfillment(orderId);
      if (!result.ok) {
        return;
      }
      try {
        const { data: book } = await supabase
          .from("books")
          .select("title, page_count")
          .eq("id", ctx.bookId)
          .single();
        const email = await getEmailForUserId(ctx.userId);
        if (email && book) {
          await sendOrderConfirmation({
            to: email,
            orderId,
            orderShortId: orderId.slice(0, 8),
            amountTotalCents: ctx.amountTotalCents,
            bookTitle: book.title ?? "My Coloring Book",
            pageCount: book.page_count ?? 0,
          });
        }
      } catch (e) {
        console.error("Order confirmation email failed", e);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Fulfillment failed for order", orderId, e);
      await logIntegrationEvent(
        {
          provider: "system",
          eventType: "fulfillment.unexpected_error",
          severity: "error",
          status: "failed",
          orderId,
          bookId: ctx.bookId,
          errorMessage: msg,
        },
        supabase,
      );
      const alertResult = await sendOpsAlert({
        subject: `[ColorDrop ops] Fulfillment threw after book_order — order ${orderId.slice(0, 8)}…`,
        textBody: [
          "Unexpected error in runFulfillment after checkout (not routed through handleTerminalFulfillmentFailure).",
          "",
          `order_id: ${orderId}`,
          `book_id: ${ctx.bookId}`,
          "",
          msg,
        ].join("\n"),
      });
      if (!alertResult.ok) {
        console.error("[stripe-webhook] ops alert failed", alertResult.error);
      }
    }
  });
}
