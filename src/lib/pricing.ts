/**
 * Customer-facing price: each Lulu bucket is rounded up to the next whole dollar
 * (print = line + fulfillment, then shipping), then BOOK_MARKUP_PERCENT /
 * SHIPPING_MARKUP_PERCENT are applied. The customer total is the sum of those
 * marked amounts, rounded up to the next whole dollar. Book vs shipping on the
 * receipt uses the marked amounts’ ratio (book line rounded to nearest dollar;
 * shipping is the remainder).
 * Conversion credits do not apply toward book purchases.
 *
 * **Single source of truth:** book customer totals must come from
 * `calculateBookPriceFromTrimCodeAsync` (used by checkout and price APIs) or,
 * if you already have Lulu cent components, `computeCustomerPricingFromLuluCents`
 * only. Do not reimplement markup or dollar rounding elsewhere.
 */

import type { PageTier, TrimSizeId } from "./book-products";
import {
  BOOK_PRODUCTS,
  getPodPackageId,
  getTrimSizeIdFromCode,
  PAGE_TIERS,
} from "./book-products";
import type { BookProduct } from "./book-products";
import {
  getDefaultCostCalcAddress,
  getPrintJobCostCalculation,
  type LuluBookShippingLevel,
  type LuluCostAddress,
} from "./lulu";

const COST_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedLuluCost = {
  lineItemCents: number;
  fulfillmentCents: number;
  shippingCents: number;
  expiresAt: number;
};

const costCache = new Map<string, CachedLuluCost>();

function costCacheKey(
  trimSizeId: TrimSizeId,
  pageTier: number,
  shippingLevel: ShippingLevelId
): string {
  return `${trimSizeId}|${pageTier}|${shippingLevel}`;
}

function parseMarkupPercentEnv(raw: string | undefined): number {
  const n = raw ? parseInt(raw, 10) : 50;
  if (Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(200, n));
}

export function getBookMarkupPercent(): number {
  return parseMarkupPercentEnv(process.env.BOOK_MARKUP_PERCENT);
}

export function getShippingMarkupPercent(): number {
  return parseMarkupPercentEnv(process.env.SHIPPING_MARKUP_PERCENT);
}

type LuluCostFetchResult =
  | {
      ok: true;
      lineItemCents: number;
      fulfillmentCents: number;
      shippingCents: number;
    }
  | { ok: false; errorReason: string };

async function fetchLuluCostParts(
  trimSizeId: TrimSizeId,
  pageTier: number,
  shippingLevel: ShippingLevelId,
  shippingAddress?: LuluCostAddress
): Promise<LuluCostFetchResult> {
  const useCache = !shippingAddress;
  const key = costCacheKey(trimSizeId, pageTier, shippingLevel);
  const now = Date.now();
  if (useCache) {
    const cached = costCache.get(key);
    if (cached && cached.expiresAt > now) {
      return {
        ok: true,
        lineItemCents: cached.lineItemCents,
        fulfillmentCents: cached.fulfillmentCents,
        shippingCents: cached.shippingCents,
      };
    }
  }
  const product = BOOK_PRODUCTS[trimSizeId];
  if (!product) {
    return { ok: false, errorReason: "Unknown trim size." };
  }
  const podPackageId = getPodPackageId(trimSizeId, pageTier);
  const address = shippingAddress ?? getDefaultCostCalcAddress();
  try {
    const result = await getPrintJobCostCalculation({
      podPackageId,
      pageCount: pageTier,
      shippingOption: shippingLevel,
      shippingAddress: address,
    });
    if (useCache) {
      costCache.set(key, {
        lineItemCents: result.lineItemCents,
        fulfillmentCents: result.fulfillmentCents,
        shippingCents: result.shippingCents,
        expiresAt: now + COST_CACHE_TTL_MS,
      });
    }
    return {
      ok: true,
      lineItemCents: result.lineItemCents,
      fulfillmentCents: result.fulfillmentCents,
      shippingCents: result.shippingCents,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[pricing] Lulu cost calculation failed:", err);
    return {
      ok: false,
      errorReason: `Lulu API error: ${message}`,
    };
  }
}

/** Round cents to nearest dollar (multiple of 100). */
export function roundToNearestDollar(cents: number): number {
  return Math.round(cents / 100) * 100;
}

/** Round cents up to the next whole dollar (multiple of 100). */
export function ceilToDollar(cents: number): number {
  return Math.ceil(cents / 100) * 100;
}

export type BookCheckoutPricing = {
  bookCents: number;
  shippingCents: number;
  totalCents: number;
  luluLineItemCents: number;
  luluFulfillmentCents: number;
  luluShippingCents: number;
  luluTotalCostCents: number;
  bookMarkupPercent: number;
  shippingMarkupPercent: number;
  marginMarkupCents: number;
};

export type BookPricingResult =
  | { ok: true; pricing: BookCheckoutPricing; printingOnlyCents: number }
  | { ok: false; error: string };

/**
 * Pure pricing step: Lulu cost components + markups → customer cents.
 * Returns null if Lulu total cost is not positive.
 */
export function computeCustomerPricingFromLuluCents(
  lineItemCents: number,
  fulfillmentCents: number,
  shippingCents: number,
  bookMarkupPercent: number,
  shippingMarkupPercent: number
): BookCheckoutPricing | null {
  const bookAndFulfillmentCents = lineItemCents + fulfillmentCents;
  const luluTotalCostCents = bookAndFulfillmentCents + shippingCents;
  if (luluTotalCostCents <= 0) return null;

  const bookLuluRoundedCents = ceilToDollar(bookAndFulfillmentCents);
  const shippingLuluRoundedCents = ceilToDollar(shippingCents);

  const markedBookCents =
    bookLuluRoundedCents * (1 + bookMarkupPercent / 100);
  const markedShippingCents =
    shippingLuluRoundedCents * (1 + shippingMarkupPercent / 100);
  const rawTotalCents = markedBookCents + markedShippingCents;
  if (rawTotalCents <= 0) return null;

  const totalCents = ceilToDollar(rawTotalCents);
  const marginMarkupCents = totalCents - luluTotalCostCents;

  const bookRatio = markedBookCents / rawTotalCents;
  const bookCents = roundToNearestDollar(totalCents * bookRatio);
  const customerShippingCents = totalCents - bookCents;

  return {
    bookCents,
    shippingCents: customerShippingCents,
    totalCents,
    luluLineItemCents: lineItemCents,
    luluFulfillmentCents: fulfillmentCents,
    luluShippingCents: shippingCents,
    luluTotalCostCents,
    bookMarkupPercent,
    shippingMarkupPercent,
    marginMarkupCents,
  };
}

/**
 * Customer-facing printing + binding only: (line + fulfillment) rounded up to
 * the next dollar, then × book markup, then rounded up to whole dollars again.
 * Excludes Lulu shipping (used for marketing / estimates).
 */
export function computePrintingOnlyCustomerCents(
  lineItemCents: number,
  fulfillmentCents: number,
  bookMarkupPercent: number
): number | null {
  const baseCents = lineItemCents + fulfillmentCents;
  if (baseCents <= 0) return null;
  const roundedBaseCents = ceilToDollar(baseCents);
  const markedCents = roundedBaseCents * (1 + bookMarkupPercent / 100);
  if (markedCents <= 0) return null;
  return ceilToDollar(markedCents);
}

export const SHIPPING_LEVELS = [
  { id: "MAIL" as const, label: "Standard", days: "7–14" },
  { id: "PRIORITY_MAIL" as const, label: "Priority", days: "5–7" },
  { id: "EXPEDITED" as const, label: "Expedited", days: "2–3" },
];

export type ShippingLevelId = LuluBookShippingLevel;

const INVALID_TRIM_TIER_ERROR =
  "Invalid book size or page count for pricing.";

/**
 * Book price from Lulu + margin only.
 * When `shippingAddress` is set, Lulu quotes use that destination (not cached).
 */
export async function calculateBookPriceFromTrimCodeAsync(
  trimCode: string,
  pageTier: number,
  shippingLevel: ShippingLevelId,
  shippingAddress?: LuluCostAddress
): Promise<BookPricingResult> {
  const trimSizeId = getTrimSizeIdFromCode(trimCode);
  if (!trimSizeId || !PAGE_TIERS.includes(pageTier as PageTier)) {
    return { ok: false, error: INVALID_TRIM_TIER_ERROR };
  }

  const costResult = await fetchLuluCostParts(
    trimSizeId,
    pageTier,
    shippingLevel,
    shippingAddress
  );
  if (!costResult.ok) {
    return { ok: false, error: costResult.errorReason };
  }

  const bookMarkupPercent = getBookMarkupPercent();
  const shippingMarkupPercent = getShippingMarkupPercent();
  const printingOnlyCents = computePrintingOnlyCustomerCents(
    costResult.lineItemCents,
    costResult.fulfillmentCents,
    bookMarkupPercent
  );
  if (printingOnlyCents == null) {
    return {
      ok: false,
      error:
        "Printing cost could not be determined. Try reloading the page or contact support.",
    };
  }
  const pricing = computeCustomerPricingFromLuluCents(
    costResult.lineItemCents,
    costResult.fulfillmentCents,
    costResult.shippingCents,
    bookMarkupPercent,
    shippingMarkupPercent
  );
  if (!pricing) {
    return {
      ok: false,
      error:
        "Printing cost could not be determined. Try reloading the page or contact support.",
    };
  }
  return { ok: true, pricing, printingOnlyCents };
}

/** Trim size and tier options for UI. */
export function getBookProduct(trimSizeId: TrimSizeId): BookProduct {
  return BOOK_PRODUCTS[trimSizeId];
}

export { PAGE_TIERS, TRIM_SIZES } from "./book-products";
export type { PageTier, TrimSizeId };
