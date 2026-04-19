/**
 * Book product configuration: trim sizes, Lulu pod_package_ids, dimensions, recommended image sizes.
 * `pod_package_id` uses Lulu’s dotted modular format: [Trim].[Ink].[Quality].[Binding].[Paper].[Finish]
 * (see https://api.lulu.com/api-docs/openapi-specs/openapi_public.yml migration notice).
 * Binding: saddle stitch (SS) for tier ≤48, perfect binding (PB) for tier >48 (see `getPodPackageId`). Verify IDs via Lulu Product Spec Sheet / Price Calculator.
 */

export const PAGE_TIERS = [12, 24, 32, 48, 64, 128] as const;
export type PageTier = (typeof PAGE_TIERS)[number];

/** Max interior page tier for saddle stitch in ColorDrop (matches `getPodPackageId`). */
export const SADDLE_STITCH_MAX_PAGES = 48;

/** Tiers printed with stapled (saddle stitch) binding; order matches `PAGE_TIERS`. */
export const PAGE_TIERS_STAPLED: PageTier[] = PAGE_TIERS.filter(
  (t): t is PageTier => t <= SADDLE_STITCH_MAX_PAGES,
);

/** Tiers printed with perfect binding; order matches `PAGE_TIERS`. */
export const PAGE_TIERS_PERFECT_BOUND: PageTier[] = PAGE_TIERS.filter(
  (t): t is PageTier => t > SADDLE_STITCH_MAX_PAGES,
);

export const TRIM_SIZES = ["pocket", "medium", "large"] as const;
export type TrimSizeId = (typeof TRIM_SIZES)[number];

export type CustomerBindingId = "stapled" | "perfect_bound";

export function getCustomerBindingForPageTier(
  pageTier: number,
): CustomerBindingId {
  return pageTier <= SADDLE_STITCH_MAX_PAGES ? "stapled" : "perfect_bound";
}

/** Compact label for tables and pills. */
export function getCustomerBindingShortLabel(pageTier: number): string {
  return getCustomerBindingForPageTier(pageTier) === "stapled"
    ? "Stapled"
    : "Perfect bound";
}

/** Primary customer-facing binding line. */
export function getCustomerBindingLabel(pageTier: number): string {
  return getCustomerBindingForPageTier(pageTier) === "stapled"
    ? "Stapled binding"
    : "Perfect-bound (paperback spine)";
}

/** Footnote: ties binding to ordered page tier and the 48→64 product step. */
export function getCustomerBindingExplanation(): string {
  return "Binding follows your book’s ordered size (page tier): up to 48 images use stapled (saddle stitch) binding; 64 images and above use perfect binding with a paperback spine, which is a different print product and changes the quoted print price.";
}

export type BookProduct = {
  id: TrimSizeId;
  label: string;
  widthInches: number;
  heightInches: number;
  trimCode: string;
  /** Saddle stitch (SS): ≤48 pages. */
  podPackageIdSaddleStitch: string;
  /** Perfect binding (PB): used when page tier is greater than 48. */
  podPackageIdPerfectBind: string;
  /** Default pod (SS) for backward compatibility when only trim is known. */
  podPackageId: string;
  /** Width and height in PDF points (1/72 inch) */
  widthPoints: number;
  heightPoints: number;
  /** Recommended min image dimensions at 300 PPI for quality warnings */
  recommendedMinWidthPx: number;
  recommendedMinHeightPx: number;
};

const PT_PER_INCH = 72;

export const BOOK_PRODUCTS: Record<TrimSizeId, BookProduct> = {
  pocket: {
    id: "pocket",
    label: "Pocket",
    widthInches: 4.25,
    heightInches: 6.875,
    trimCode: "0425X0687",
    podPackageIdSaddleStitch: "0425X0687.BW.STD.SS.060UW444.MXX",
    podPackageIdPerfectBind: "0425X0687.BW.STD.PB.060UW444.MXX",
    podPackageId: "0425X0687.BW.STD.SS.060UW444.MXX",
    widthPoints: 4.25 * PT_PER_INCH,
    heightPoints: 6.875 * PT_PER_INCH,
    recommendedMinWidthPx: 1275,
    recommendedMinHeightPx: 2063,
  },
  medium: {
    id: "medium",
    label: "Medium",
    widthInches: 7,
    heightInches: 10,
    trimCode: "0700X1000",
    podPackageIdSaddleStitch: "0700X1000.BW.STD.SS.060UW444.MXX",
    podPackageIdPerfectBind: "0700X1000.BW.STD.PB.060UW444.MXX",
    podPackageId: "0700X1000.BW.STD.SS.060UW444.MXX",
    widthPoints: 7 * PT_PER_INCH,
    heightPoints: 10 * PT_PER_INCH,
    recommendedMinWidthPx: 2100,
    recommendedMinHeightPx: 3000,
  },
  large: {
    id: "large",
    label: "Large",
    widthInches: 8.5,
    heightInches: 11,
    trimCode: "0850X1100",
    podPackageIdSaddleStitch: "0850X1100.BW.STD.SS.060UW444.MXX",
    podPackageIdPerfectBind: "0850X1100.BW.STD.PB.060UW444.MXX",
    podPackageId: "0850X1100.BW.STD.SS.060UW444.MXX",
    widthPoints: 8.5 * PT_PER_INCH,
    heightPoints: 11 * PT_PER_INCH,
    recommendedMinWidthPx: 2550,
    recommendedMinHeightPx: 3300,
  },
};

/**
 * Return the Lulu pod_package_id for the given trim and page tier.
 * Uses saddle stitch (SS) for tier ≤48, perfect binding (PB) for tier >48.
 */
export function getPodPackageId(
  trimSizeId: TrimSizeId,
  pageTier: number,
): string {
  const product = BOOK_PRODUCTS[trimSizeId];
  if (!product) return BOOK_PRODUCTS.large.podPackageId;
  return pageTier <= SADDLE_STITCH_MAX_PAGES
    ? product.podPackageIdSaddleStitch
    : product.podPackageIdPerfectBind;
}

export function getProductByTrimCode(trimCode: string): BookProduct | null {
  return (
    (Object.values(BOOK_PRODUCTS) as BookProduct[]).find(
      (p) => p.trimCode === trimCode,
    ) ?? null
  );
}

/** Trim size id from Lulu trim code (e.g. 0850X1100 -> large). */
export function getTrimSizeIdFromCode(trimCode: string): TrimSizeId | null {
  const p = getProductByTrimCode(trimCode);
  return p ? p.id : null;
}

export function getProductByTrimSizeId(id: TrimSizeId): BookProduct {
  return BOOK_PRODUCTS[id];
}

export function isPageTier(tier: number): tier is PageTier {
  return PAGE_TIERS.includes(tier as PageTier);
}

export function isTrimSizeId(id: string): id is TrimSizeId {
  return TRIM_SIZES.includes(id as TrimSizeId);
}
