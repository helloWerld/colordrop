import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { runFulfillment } from "@/lib/fulfillment";
import { getEmailForUserId, sendOrderConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !sig) {
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: { type: string; data: { object: { id?: string; metadata?: Record<string, string> } } };
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret) as typeof event;
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      amount_total?: number | null;
      payment_intent?: string;
      metadata?: Record<string, string>;
    };
    const meta = session.metadata ?? {};
    const supabase = createServerSupabaseClient();

    if (meta.type === "credit_purchase" && meta.userId && meta.package_type) {
      const { data: existing } = await supabase
        .from("credit_transactions")
        .select("id")
        .eq("reference_id", session.id)
        .single();
      if (existing) {
        return NextResponse.json({ received: true });
      }
      const col =
        meta.package_type === "single"
          ? "credits_single"
          : meta.package_type === "pack_50"
            ? "credits_pack_50"
            : "credits_pack_100";
      const qty = meta.package_type === "single" ? 1 : meta.package_type === "pack_50" ? 50 : 100;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, credits_single, credits_pack_50, credits_pack_100")
        .eq("user_id", meta.userId)
        .single();
      if (profile) {
        const current = (profile as Record<string, number>)[col] ?? 0;
        await supabase
          .from("user_profiles")
          .update({
            [col]: current + qty,
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
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .single();
      if (existingOrder) {
        return NextResponse.json({ received: true });
      }
      const amountTotal = session.amount_total ?? 0;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          book_id: meta.bookId,
          user_id: meta.userId,
          stripe_checkout_session_id: session.id,
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
          credits_applied_value_cents: parseInt(meta.credits_applied_value_cents ?? "0", 10),
          status: "paid",
        })
        .select("id")
        .single();
      if (!orderErr && order) {
        await supabase
          .from("books")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", meta.bookId);
        runFulfillment(order.id).catch((e) => {
          console.error("Fulfillment failed for order", order.id, e);
        });
        (async () => {
          try {
            const { data: book } = await supabase
              .from("books")
              .select("title, page_count")
              .eq("id", meta.bookId)
              .single();
            const email = await getEmailForUserId(meta.userId);
            if (email && book) {
              await sendOrderConfirmation({
                to: email,
                orderId: order.id,
                orderShortId: order.id.slice(0, 8),
                amountTotalCents: amountTotal,
                bookTitle: book.title ?? "My Coloring Book",
                pageCount: book.page_count ?? 0,
              });
            }
          } catch (e) {
            console.error("Order confirmation email failed", e);
          }
        })();
      }
    }
  }

  return NextResponse.json({ received: true });
}
