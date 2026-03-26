/**
 * Book product configuration: trim sizes, Lulu pod_package_ids, dimensions, recommended image sizes.
 * Binding: saddle stitch (SS) for ≤48 pages, perfect binding (PB) for 64+ (per Lulu). Verify IDs via Lulu Product Spec Sheet / Price Calculator.
 */

export const PAGE_TIERS = [12, 24, 32, 48, 64, 128] as const;
export type PageTier = (typeof PAGE_TIERS)[number];

export const TRIM_SIZES = ["pocket", "medium", "large"] as const;
export type TrimSizeId = (typeof TRIM_SIZES)[number];

/** Per Lulu: saddle stitch recommended for 48 or fewer pages; perfect binding for 32–800. */
export const SADDLE_STITCH_MAX_PAGES = 48;

export type BookProduct = {
  id: TrimSizeId;
  label: string;
  widthInches: number;
  heightInches: number;
  trimCode: string;
  /** Saddle stitch (SS): ≤48 pages. */
  podPackageIdSaddleStitch: string;
  /** Perfect binding (PB): 32–800 pages. */
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
    podPackageIdSaddleStitch: "0425X0687BWSTDSS060UW444MXX",
    podPackageIdPerfectBind: "0425X0687BWSTDPB060UW444MXX",
    podPackageId: "0425X0687BWSTDSS060UW444MXX",
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
    podPackageIdSaddleStitch: "0700X1000BWSTDSS060UW444MXX",
    podPackageIdPerfectBind: "0700X1000BWSTDPB060UW444MXX",
    podPackageId: "0700X1000BWSTDSS060UW444MXX",
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
    podPackageIdSaddleStitch: "0850X1100BWSTDSS060UW444MXX",
    podPackageIdPerfectBind: "0850X1100BWSTDPB060UW444MXX",
    podPackageId: "0850X1100BWSTDSS060UW444MXX",
    widthPoints: 8.5 * PT_PER_INCH,
    heightPoints: 11 * PT_PER_INCH,
    recommendedMinWidthPx: 2550,
    recommendedMinHeightPx: 3300,
  },
};

/**
 * Return the Lulu pod_package_id for the given trim and page tier.
 * Uses saddle stitch (SS) for tier ≤48, perfect binding (PB) for 64+.
 */
export function getPodPackageId(trimSizeId: TrimSizeId, pageTier: number): string {
  const product = BOOK_PRODUCTS[trimSizeId];
  if (!product) return BOOK_PRODUCTS.large.podPackageId;
  return pageTier <= SADDLE_STITCH_MAX_PAGES
    ? product.podPackageIdSaddleStitch
    : product.podPackageIdPerfectBind;
}

export function getProductByTrimCode(trimCode: string): BookProduct | null {
  return (
    (Object.values(BOOK_PRODUCTS) as BookProduct[]).find(
      (p) => p.trimCode === trimCode
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
