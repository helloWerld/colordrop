/** User-facing message when checkout is blocked (API + checkout page). */
export const DUPLICATE_BOOK_CHECKOUT_ERROR =
  "This book has already been ordered or paid.";

/** Pre-payment `books.status` values allowed to start Stripe checkout (see supabase migrations). */
export const BOOK_STATUSES_ALLOWED_FOR_CHECKOUT = [
  "draft",
  "previewing",
  "ordering",
] as const;

export type BookStatusAllowedForCheckout =
  (typeof BOOK_STATUSES_ALLOWED_FOR_CHECKOUT)[number];

const allowedSet = new Set<string>(BOOK_STATUSES_ALLOWED_FOR_CHECKOUT);

/** True if an existing order prevents a new checkout (refunded orders can reorder). */
export function orderBlocksCheckout(
  order: { status: string } | null | undefined,
): boolean {
  if (!order) return false;
  return order.status !== "refunded";
}

export function isBookEligibleForCheckout(
  bookStatus: string | null | undefined,
  orderForBook: { status: string } | null | undefined,
): boolean {
  if (orderBlocksCheckout(orderForBook)) return false;
  const s = bookStatus ?? "";
  return allowedSet.has(s);
}
