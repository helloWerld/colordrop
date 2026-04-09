import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

vi.mock("@/lib/email", () => ({
  sendOpsAlert: vi.fn().mockResolvedValue({ ok: true }),
}));

import { sendOpsAlert } from "@/lib/email";
import {
  handleBookOrderInsertFailure,
  isAlreadyRefundedError,
  isAlreadyRefundedNote,
  refundPaymentIntentOrNote,
  resolveCheckoutPaymentIntentId,
} from "./stripe-book-order-webhook";

describe("isAlreadyRefundedError", () => {
  it("returns true for charge_already_refunded code", () => {
    expect(
      isAlreadyRefundedError({
        code: "charge_already_refunded",
        message: "x",
      }),
    ).toBe(true);
  });

  it("returns true when message mentions fully refunded", () => {
    expect(
      isAlreadyRefundedError({
        message: "The payment has already been fully refunded",
      }),
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isAlreadyRefundedError({ message: "network error" })).toBe(false);
  });
});

describe("isAlreadyRefundedNote", () => {
  it("detects idempotent refund note", () => {
    expect(
      isAlreadyRefundedNote(
        "Refund not created: charge already refunded (idempotent).",
      ),
    ).toBe(true);
    expect(isAlreadyRefundedNote("Refund API error")).toBe(false);
  });
});

describe("refundPaymentIntentOrNote", () => {
  it("returns manual note when no payment intent", async () => {
    const stripe = {} as Stripe;
    const r = await refundPaymentIntentOrNote(stripe, null);
    expect(r.refundNote).toContain("No payment_intent");
  });

  it("creates refund when payment intent exists", async () => {
    const create = vi.fn().mockResolvedValue({ id: "re_abc" });
    const stripe = { refunds: { create } } as unknown as Stripe;
    const r = await refundPaymentIntentOrNote(stripe, "pi_1");
    expect(r.refundId).toBe("re_abc");
    expect(r.refundNote).toBe("");
    expect(create).toHaveBeenCalledWith({ payment_intent: "pi_1" });
  });
});

describe("resolveCheckoutPaymentIntentId", () => {
  it("returns hint when provided", async () => {
    const stripe = {} as Stripe;
    await expect(
      resolveCheckoutPaymentIntentId(stripe, "cs_x", "pi_hint"),
    ).resolves.toBe("pi_hint");
  });

  it("retrieves session when hint is null", async () => {
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            payment_intent: "pi_from_api",
          }),
        },
      },
    } as unknown as Stripe;
    await expect(
      resolveCheckoutPaymentIntentId(stripe, "cs_x", null),
    ).resolves.toBe("pi_from_api");
    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_x", {
      expand: ["payment_intent"],
    });
  });
});

function mockSupabaseForOrderByBook(
  orderRow: { id: string; stripe_checkout_session_id: string | null } | null,
): SupabaseClient {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: orderRow, error: null }),
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

describe("handleBookOrderInsertFailure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sessionId = "cs_test_123";
  const bookId = "book-uuid";
  const userId = "user_1";

  it("does not refund or alert when order for book matches this session", async () => {
    const stripe = {
      refunds: { create: vi.fn() },
      checkout: { sessions: { retrieve: vi.fn() } },
    } as unknown as Stripe;
    const supabase = mockSupabaseForOrderByBook({
      id: "ord-1",
      stripe_checkout_session_id: sessionId,
    });

    await handleBookOrderInsertFailure(stripe, supabase, {
      sessionId,
      bookId,
      userId,
      orderErr: { message: "duplicate key", code: "23505" },
      stripePaymentIntentId: "pi_123",
    });

    expect(stripe.refunds.create).not.toHaveBeenCalled();
    expect(sendOpsAlert).not.toHaveBeenCalled();
  });

  it("refunds and alerts when another session owns the order", async () => {
    const stripe = {
      refunds: {
        create: vi.fn().mockResolvedValue({ id: "re_123" }),
      },
      checkout: { sessions: { retrieve: vi.fn() } },
    } as unknown as Stripe;
    const supabase = mockSupabaseForOrderByBook({
      id: "ord-1",
      stripe_checkout_session_id: "cs_other",
    });

    await handleBookOrderInsertFailure(stripe, supabase, {
      sessionId,
      bookId,
      userId,
      orderErr: { message: "unique violation", code: "23505" },
      stripePaymentIntentId: "pi_123",
    });

    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_123",
    });
    expect(sendOpsAlert).toHaveBeenCalledTimes(1);
    const call = vi.mocked(sendOpsAlert).mock.calls[0]?.[0];
    expect(call?.subject).toContain("Book order insert failed");
    expect(call?.textBody).toContain("cs_other");
    expect(call?.textBody).toContain("re_123");
  });

  it("refunds and alerts when no order row exists", async () => {
    const stripe = {
      refunds: {
        create: vi.fn().mockResolvedValue({ id: "re_999" }),
      },
      checkout: { sessions: { retrieve: vi.fn() } },
    } as unknown as Stripe;
    const supabase = mockSupabaseForOrderByBook(null);

    await handleBookOrderInsertFailure(stripe, supabase, {
      sessionId,
      bookId,
      userId,
      orderErr: { message: "insert failed", code: "XX000" },
      stripePaymentIntentId: "pi_abc",
    });

    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_abc",
    });
    expect(sendOpsAlert).toHaveBeenCalled();
    expect(vi.mocked(sendOpsAlert).mock.calls[0]?.[0].textBody).toContain(
      "No order row",
    );
  });

  it("still alerts when refund API reports already refunded", async () => {
    const stripe = {
      refunds: {
        create: vi.fn().mockRejectedValue({
          code: "charge_already_refunded",
          message: "already refunded",
        }),
      },
      checkout: { sessions: { retrieve: vi.fn() } },
    } as unknown as Stripe;
    const supabase = mockSupabaseForOrderByBook(null);

    await handleBookOrderInsertFailure(stripe, supabase, {
      sessionId,
      bookId,
      userId,
      orderErr: { message: "fail" },
      stripePaymentIntentId: "pi_x",
    });

    expect(sendOpsAlert).toHaveBeenCalled();
    expect(vi.mocked(sendOpsAlert).mock.calls[0]?.[0].textBody).toContain(
      "already refunded",
    );
  });
});
