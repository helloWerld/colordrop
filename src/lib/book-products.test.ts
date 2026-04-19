import { describe, expect, it } from "vitest";
import {
  BOOK_PRODUCTS,
  getCustomerBindingExplanation,
  getCustomerBindingForPageTier,
  getCustomerBindingLabel,
  getCustomerBindingShortLabel,
  getPodPackageId,
  getTrimSizeIdFromCode,
  PAGE_TIERS,
  PAGE_TIERS_PERFECT_BOUND,
  PAGE_TIERS_STAPLED,
  TRIM_SIZES,
} from "./book-products";

/** Lulu dotted modular SKU: trim.BW.STD.binding.paper.finish */
const DOTTED_BW_STD_SKU = /^\d{4}X\d{4}\.BW\.STD\.(SS|PB)\.060UW444\.MXX$/;

describe("getPodPackageId / getTrimSizeIdFromCode", () => {
  it("uses Lulu dotted pod_package_id format for every configured SKU", () => {
    for (const id of TRIM_SIZES) {
      const p = BOOK_PRODUCTS[id];
      expect(p.podPackageIdSaddleStitch).toMatch(DOTTED_BW_STD_SKU);
      expect(p.podPackageIdPerfectBind).toMatch(DOTTED_BW_STD_SKU);
      expect(p.podPackageId).toMatch(DOTTED_BW_STD_SKU);
    }
  });

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

describe("PAGE_TIERS_STAPLED / PAGE_TIERS_PERFECT_BOUND", () => {
  it("partitions PAGE_TIERS in order", () => {
    expect([...PAGE_TIERS_STAPLED, ...PAGE_TIERS_PERFECT_BOUND]).toEqual([
      ...PAGE_TIERS,
    ]);
  });
});

describe("customer binding helpers", () => {
  it("maps each PAGE_TIERS value consistently with getPodPackageId", () => {
    for (const tier of PAGE_TIERS) {
      const binding = getCustomerBindingForPageTier(tier);
      if (tier <= 48) {
        expect(binding).toBe("stapled");
        expect(getCustomerBindingShortLabel(tier)).toBe("Stapled");
        expect(getCustomerBindingLabel(tier)).toBe("Stapled binding");
      } else {
        expect(binding).toBe("perfect_bound");
        expect(getCustomerBindingShortLabel(tier)).toBe("Perfect bound");
        expect(getCustomerBindingLabel(tier)).toBe(
          "Perfect-bound (paperback spine)",
        );
      }
    }
  });

  it("returns a non-empty binding explanation", () => {
    expect(getCustomerBindingExplanation().length).toBeGreaterThan(20);
  });
});
