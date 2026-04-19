import { unstable_cache } from "next/cache";
import { calculateBookPriceFromTrimCodeAsync } from "@/lib/pricing";
import type { PageTier, TrimSizeId } from "@/lib/book-products";
import { BOOK_PRODUCTS, PAGE_TIERS, TRIM_SIZES } from "@/lib/book-products";

/**
 * Cached printing-and-binding-only prices (MAIL) for the marketing pricing table.
 * Revalidates every hour; failures on cold miss throw (page shows error UI).
 */
export const getCachedMarketingBookPriceMatrix = unstable_cache(
  async (): Promise<Record<TrimSizeId, Record<PageTier, number>>> => {
    const matrix = {} as Record<TrimSizeId, Record<PageTier, number>>;
    await Promise.all(
      TRIM_SIZES.map(async (trimId) => {
        const product = BOOK_PRODUCTS[trimId];
        matrix[trimId] = {} as Record<PageTier, number>;
        await Promise.all(
          PAGE_TIERS.map(async (tier) => {
            const result = await calculateBookPriceFromTrimCodeAsync(
              product.trimCode,
              tier,
              "MAIL"
            );
            if (!result.ok) {
              throw new Error(result.error);
            }
            matrix[trimId][tier] = result.printingOnlyCents;
          })
        );
      })
    );
    return matrix;
  },
  ["marketing-book-price-matrix-v2"],
  { revalidate: 3600 }
);
