import { describe, expect, it } from "vitest";
import {
  ceilToDollar,
  computeCustomerPricingFromLuluCents,
  computePrintingOnlyCustomerCents,
  roundToNearestDollar,
} from "./pricing";

describe("roundToNearestDollar", () => {
  it("rounds to whole dollars in cents", () => {
    expect(roundToNearestDollar(149)).toBe(100);
    expect(roundToNearestDollar(150)).toBe(200);
    expect(roundToNearestDollar(1000)).toBe(1000);
  });
});

describe("ceilToDollar", () => {
  it("rounds up to whole dollars in cents", () => {
    expect(ceilToDollar(149)).toBe(200);
    expect(ceilToDollar(150)).toBe(200);
    expect(ceilToDollar(1000)).toBe(1000);
    expect(ceilToDollar(2701)).toBe(2800);
  });
});

describe("computeCustomerPricingFromLuluCents", () => {
  it("applies margin, ceils total to whole dollars, and splits proportionally", () => {
    const lineItemCents = 1000;
    const fulfillmentCents = 500;
    const shippingCents = 301;
    const p = computeCustomerPricingFromLuluCents(
      lineItemCents,
      fulfillmentCents,
      shippingCents,
      50,
      50
    );
    expect(p).not.toBeNull();
    const luluTotal = 1000 + 500 + 301;
    expect(p!.luluTotalCostCents).toBe(luluTotal);
    expect(p!.bookMarkupPercent).toBe(50);
    expect(p!.shippingMarkupPercent).toBe(50);
    // Print + fulfillment → $15, shipping → $4 after per-bucket dollar ceil; then 50% each; total $28.50 → $29.00
    const expectedTotal = ceilToDollar(
      ceilToDollar(1500) * 1.5 + ceilToDollar(301) * 1.5
    );
    expect(p!.totalCents).toBe(expectedTotal);
    expect(p!.marginMarkupCents).toBe(expectedTotal - luluTotal);
    expect(p!.bookCents + p!.shippingCents).toBe(p!.totalCents);
  });

  it("applies book and shipping markups independently", () => {
    const lineItemCents = 1000;
    const fulfillmentCents = 500;
    const shippingCents = 300;
    const p = computeCustomerPricingFromLuluCents(
      lineItemCents,
      fulfillmentCents,
      shippingCents,
      0,
      50
    );
    expect(p).not.toBeNull();
    const luluTotal = 1800;
    expect(p!.luluTotalCostCents).toBe(luluTotal);
    const markedBook = 1500;
    const markedShip = 450;
    const rawTotal = markedBook + markedShip;
    expect(p!.totalCents).toBe(ceilToDollar(rawTotal));
    expect(p!.bookCents + p!.shippingCents).toBe(p!.totalCents);
    expect(p!.marginMarkupCents).toBe(p!.totalCents - luluTotal);
  });

  it("returns null when Lulu total is zero", () => {
    expect(
      computeCustomerPricingFromLuluCents(0, 0, 0, 50, 50)
    ).toBeNull();
  });

  it("returns null when Lulu total is negative", () => {
    expect(
      computeCustomerPricingFromLuluCents(-100, 0, 0, 50, 50)
    ).toBeNull();
  });
});

describe("computePrintingOnlyCustomerCents", () => {
  it("applies book markup and ceils to whole dollars", () => {
    expect(computePrintingOnlyCustomerCents(1000, 500, 50)).toBe(
      ceilToDollar(2250)
    );
  });

  it("returns null when line + fulfillment is zero", () => {
    expect(computePrintingOnlyCustomerCents(0, 0, 50)).toBeNull();
  });

  it("returns null when line + fulfillment is negative", () => {
    expect(computePrintingOnlyCustomerCents(-100, 50, 0)).toBeNull();
  });

  it("ignores shipping (same line+fulfillment as different shipping quotes)", () => {
    const line = 800;
    const fulfillment = 200;
    expect(computePrintingOnlyCustomerCents(line, fulfillment, 0)).toBe(1000);
  });
});
