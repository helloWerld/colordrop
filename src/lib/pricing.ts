/**
 * Customer-facing book price: $0.99/page + $4.99 platform fee + shipping.
 * Credits applied (from book.credits_applied_value_cents) reduce the total.
 */

const CENTS_PER_PAGE = 99;
const PLATFORM_FEE_CENTS = 499;

export const SHIPPING_LEVELS = [
  { id: "MAIL" as const, label: "Standard", days: "7–14", cents: 399 },
  { id: "PRIORITY_MAIL" as const, label: "Priority", days: "5–7", cents: 599 },
  { id: "EXPEDITED" as const, label: "Expedited", days: "2–3", cents: 999 },
];

export type ShippingLevelId = "MAIL" | "PRIORITY_MAIL" | "EXPEDITED";

export function calculateBookPrice(
  pageCount: number,
  shippingLevel: ShippingLevelId,
  creditsAppliedCents: number
): { subtotalCents: number; shippingCents: number; creditsCents: number; totalCents: number } {
  const shipping = SHIPPING_LEVELS.find((s) => s.id === shippingLevel);
  const shippingCents = shipping?.cents ?? 399;
  const subtotalCents = pageCount * CENTS_PER_PAGE + PLATFORM_FEE_CENTS;
  const totalBeforeCredits = subtotalCents + shippingCents;
  const totalCents = Math.max(0, totalBeforeCredits - creditsAppliedCents);
  return {
    subtotalCents,
    shippingCents,
    creditsCents: creditsAppliedCents,
    totalCents,
  };
}
