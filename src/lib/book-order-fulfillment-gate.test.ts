import { describe, expect, it } from "vitest";
import {
  isOrderFulfillmentFailed,
  isOrderPrintSubmitted,
  shouldEnqueueFulfillment,
} from "./book-order-fulfillment-gate";

describe("shouldEnqueueFulfillment", () => {
  it("returns false when Lulu print job id is set", () => {
    expect(
      shouldEnqueueFulfillment({
        lulu_print_job_id: 12345,
        status: "submitted_to_print",
      }),
    ).toBe(false);
  });

  it("returns false for terminal error or refunded", () => {
    expect(
      shouldEnqueueFulfillment({
        lulu_print_job_id: null,
        status: "error",
      }),
    ).toBe(false);
    expect(
      shouldEnqueueFulfillment({
        lulu_print_job_id: null,
        status: "refunded",
      }),
    ).toBe(false);
  });

  it("returns true for paid or processing without Lulu id", () => {
    expect(
      shouldEnqueueFulfillment({
        lulu_print_job_id: null,
        status: "paid",
      }),
    ).toBe(true);
    expect(
      shouldEnqueueFulfillment({
        lulu_print_job_id: null,
        status: "processing",
      }),
    ).toBe(true);
  });
});

describe("isOrderPrintSubmitted", () => {
  it("is true only when lulu_print_job_id is non-null", () => {
    expect(
      isOrderPrintSubmitted({ lulu_print_job_id: 1, status: "paid" }),
    ).toBe(true);
    expect(
      isOrderPrintSubmitted({ lulu_print_job_id: null, status: "paid" }),
    ).toBe(false);
  });
});

describe("isOrderFulfillmentFailed", () => {
  it("matches error and refunded only", () => {
    expect(
      isOrderFulfillmentFailed({ lulu_print_job_id: null, status: "error" }),
    ).toBe(true);
    expect(
      isOrderFulfillmentFailed({
        lulu_print_job_id: null,
        status: "refunded",
      }),
    ).toBe(true);
    expect(
      isOrderFulfillmentFailed({ lulu_print_job_id: null, status: "paid" }),
    ).toBe(false);
  });
});
