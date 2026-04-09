import { describe, it, expect } from "vitest";
import {
  isBookEligibleForCheckout,
  orderBlocksCheckout,
} from "@/lib/book-checkout-eligibility";

describe("orderBlocksCheckout", () => {
  it("false when no order", () => {
    expect(orderBlocksCheckout(null)).toBe(false);
    expect(orderBlocksCheckout(undefined)).toBe(false);
  });

  it("true for non-refunded order", () => {
    expect(orderBlocksCheckout({ status: "paid" })).toBe(true);
    expect(orderBlocksCheckout({ status: "processing" })).toBe(true);
  });

  it("false for refunded order", () => {
    expect(orderBlocksCheckout({ status: "refunded" })).toBe(false);
  });
});

describe("isBookEligibleForCheckout", () => {
  it("allows ordering book when only refunded order exists", () => {
    expect(
      isBookEligibleForCheckout("ordering", { status: "refunded" }),
    ).toBe(true);
  });

  it("blocks when paid order exists", () => {
    expect(isBookEligibleForCheckout("ordering", { status: "paid" })).toBe(
      false,
    );
  });

  it("blocks wrong book status even without order", () => {
    expect(isBookEligibleForCheckout("paid", null)).toBe(false);
  });
});
