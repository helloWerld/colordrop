import { describe, expect, it } from "vitest";
import {
  BOOK_PRODUCTS,
  getPodPackageId,
  getTrimSizeIdFromCode,
  PAGE_TIERS,
  TRIM_SIZES,
} from "./book-products";

describe("getPodPackageId / getTrimSizeIdFromCode", () => {
  it("resolves trim code round-trip for every trim size", () => {
    for (const id of TRIM_SIZES) {
      const code = BOOK_PRODUCTS[id].trimCode;
      expect(getTrimSizeIdFromCode(code)).toBe(id);
    }
  });

  it("matches insert path: SS for tier <= 48, PB for tier > 48", () => {
    for (const trimId of TRIM_SIZES) {
      const product = BOOK_PRODUCTS[trimId];
      for (const tier of PAGE_TIERS) {
        const pod = getPodPackageId(trimId, tier);
        if (tier <= 48) {
          expect(pod).toBe(product.podPackageIdSaddleStitch);
        } else {
          expect(pod).toBe(product.podPackageIdPerfectBind);
        }
      }
    }
  });
});
