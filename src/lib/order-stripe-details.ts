import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export type OrderStripePaymentDetails = {
  bookCents: number | null;
  shippingCents: number | null;
  paymentMethodSummary: string | null;
};

function lineItemProductName(item: Stripe.LineItem): string {
  const price = item.price;
  if (price && typeof price.product === "object" && price.product) {
    const p = price.product as Stripe.Product;
    if (!p.deleted && typeof p.name === "string") return p.name;
  }
  return item.description?.trim() ?? "";
}

function lineItemCategory(
  item: Stripe.LineItem,
): "book" | "shipping" | "other" {
  const name = `${lineItemProductName(item)} ${item.description ?? ""}`.toLowerCase();
  if (name.includes("shipping")) return "shipping";
  if (name.includes("book") || name.includes("printing") || name.includes("binding")) {
    return "book";
  }
  return "other";
}

function paymentMethodSummaryFromSession(session: Stripe.Checkout.Session): string | null {
  const types = session.payment_method_types;
  const piRaw = session.payment_intent;
  if (typeof piRaw === "object" && piRaw && piRaw.payment_method) {
    const pm = piRaw.payment_method;
    if (typeof pm === "object" && pm && !("deleted" in pm && pm.deleted)) {
      if (pm.type === "card" && pm.card) {
        const brand =
          pm.card.display_brand ?? pm.card.brand ?? "Card";
        const last4 = pm.card.last4;
        if (last4) {
          return `${brand} ····${last4}`;
        }
        return brand;
      }
      return pm.type.replace(/_/g, " ");
    }
  }
  if (types?.length) {
    return types.map((t) => t.replace(/_/g, " ")).join(", ");
  }
  return null;
}

/**
 * Best-effort Stripe Checkout details for book orders. Returns null on any failure.
 */
export async function getOrderStripePaymentDetails(
  stripeCheckoutSessionId: string | null | undefined,
): Promise<OrderStripePaymentDetails | null> {
  if (!stripeCheckoutSessionId?.trim()) return null;

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return null;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      stripeCheckoutSessionId,
      { expand: ["payment_intent.payment_method"] },
    );

    const { data: lineItems } = await stripe.checkout.sessions.listLineItems(
      stripeCheckoutSessionId,
      { limit: 25, expand: ["data.price.product"] },
    );

    let bookCents: number | null = null;
    let shippingCents: number | null = null;

    for (const item of lineItems) {
      const cat = lineItemCategory(item);
      const cents = item.amount_total ?? item.amount_subtotal ?? null;
      if (cents == null) continue;
      if (cat === "book") bookCents = (bookCents ?? 0) + cents;
      else if (cat === "shipping") shippingCents = (shippingCents ?? 0) + cents;
    }

    if (bookCents === 0) bookCents = null;
    if (shippingCents === 0) shippingCents = null;

    return {
      bookCents,
      shippingCents,
      paymentMethodSummary: paymentMethodSummaryFromSession(session),
    };
  } catch {
    return null;
  }
}
