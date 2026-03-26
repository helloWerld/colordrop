import { describe, expect, it } from "vitest";
import {
  ceilToDollar,
  computeCustomerPricingFromLuluCents,
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
    const expectedTotal = ceilToDollar(luluTotal * 1.5);
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
