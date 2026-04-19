/**
 * Display helpers for cents returned by book pricing APIs
 * (`calculateBookPriceFromTrimCodeAsync` → `computeCustomerPricingFromLuluCents`).
 * Kept separate from `pricing.ts` so client components do not bundle server Lulu code.
 */

export function formatCustomerUsdWholeDollarsFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
