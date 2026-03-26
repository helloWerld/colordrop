import { describe, expect, it } from "vitest";
import {
  CA_PROVINCE_CODES,
  CA_PROVINCE_OPTIONS,
  SHIPPING_COUNTRY_CODES,
  US_CHECKOUT_STATE_CODES,
  US_STATE_OPTIONS,
} from "./shipping-regions";

describe("shipping-regions", () => {
  it("limits checkout countries to US and CA", () => {
    expect(SHIPPING_COUNTRY_CODES).toEqual(["US", "CA"]);
  });

  it("has 13 Canadian provinces/territories", () => {
    expect(CA_PROVINCE_OPTIONS).toHaveLength(13);
    expect(CA_PROVINCE_CODES.size).toBe(13);
  });

  it("keeps US option codes in sync with validation set", () => {
    for (const { value } of US_STATE_OPTIONS) {
      expect(US_CHECKOUT_STATE_CODES.has(value)).toBe(true);
    }
    expect(US_STATE_OPTIONS.length).toBe(US_CHECKOUT_STATE_CODES.size);
  });
});
