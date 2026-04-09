import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleTerminalFulfillmentFailure } from "@/lib/fulfillment-failure";

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({}),
}));

vi.mock("@/lib/stripe-book-order-webhook", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe-book-order-webhook")>();
  return {
    ...actual,
    refundPaymentIntentOrNote: vi.fn(),
  };
});

vi.mock("@/lib/email", () => ({
  getEmailForUserId: vi.fn().mockResolvedValue(null),
  sendFulfillmentFailureCustomerEmail: vi.fn().mockResolvedValue({ ok: true }),
  sendOpsAlert: vi.fn().mockResolvedValue({ ok: true }),
}));

import { refundPaymentIntentOrNote } from "@/lib/stripe-book-order-webhook";

describe("handleTerminalFulfillmentFailure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets order refunded and book ordering when refund succeeds", async () => {
    vi.mocked(refundPaymentIntentOrNote).mockResolvedValue({
      refundId: "re_123",
      refundNote: "",
    });

    const orderEq = vi.fn().mockResolvedValue({ error: null });
    const orderUpdate = vi.fn().mockReturnValue({ eq: orderEq });
    const bookEq = vi.fn().mockResolvedValue({ error: null });
    const bookUpdate = vi.fn().mockReturnValue({ eq: bookEq });
    const supabase = {
      from: (table: string) => {
        if (table === "orders") {
          return { update: orderUpdate };
        }
        if (table === "books") {
          return { update: bookUpdate };
        }
        return { update: vi.fn().mockReturnValue({ eq: vi.fn() }) };
      },
    };

    await handleTerminalFulfillmentFailure(supabase as never, {
      orderId: "ord-1",
      bookId: "book-1",
      userId: "user_1",
      stripePaymentIntentId: "pi_1",
      bookTitle: "T",
      phase: "pre_lulu",
      errorMessage: "oops",
    });

    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "refunded",
        stripe_refund_id: "re_123",
      }),
    );
    expect(orderEq).toHaveBeenCalledWith("id", "ord-1");
    expect(bookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ordering" }),
    );
    expect(bookEq).toHaveBeenCalledWith("id", "book-1");
  });

  it("sets order error when refund API fails", async () => {
    vi.mocked(refundPaymentIntentOrNote).mockResolvedValue({
      refundNote: "Refund API error: network",
    });

    const orderEq = vi.fn().mockResolvedValue({ error: null });
    const orderUpdate = vi.fn().mockReturnValue({ eq: orderEq });
    const supabase = {
      from: (table: string) => {
        if (table === "orders") return { update: orderUpdate };
        if (table === "books") return { update: vi.fn() };
        return { update: vi.fn().mockReturnValue({ eq: vi.fn() }) };
      },
    };

    await handleTerminalFulfillmentFailure(supabase as never, {
      orderId: "ord-1",
      bookId: "book-1",
      userId: "user_1",
      stripePaymentIntentId: "pi_1",
      bookTitle: "T",
      phase: "lulu",
      errorMessage: "Lulu down",
    });

    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });
});
