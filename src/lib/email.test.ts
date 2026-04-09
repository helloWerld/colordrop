import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn(),
}));

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: sendMock,
    },
  })),
}));

describe("email config behavior", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.OPS_ALERT_EMAIL;
  });

  it("returns not configured when RESEND_API_KEY is missing", async () => {
    const { sendOrderConfirmation } = await import("@/lib/email");
    const result = await sendOrderConfirmation({
      to: "test@example.com",
      orderId: "ord_1",
      orderShortId: "ord_1",
      amountTotalCents: 1200,
      bookTitle: "My Book",
      pageCount: 20,
    });

    expect(result).toEqual({ ok: false, error: "Resend not configured" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("uses configured sender and ops inbox when key exists", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "ColorDrop <orders@colordrop.ai>";
    process.env.OPS_ALERT_EMAIL = "ops@colordrop.ai";
    sendMock.mockResolvedValue({ error: null });

    const { sendOpsAlert } = await import("@/lib/email");
    const result = await sendOpsAlert({
      subject: "Alert",
      textBody: "Body",
    });

    expect(result).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "ColorDrop <orders@colordrop.ai>",
        to: ["ops@colordrop.ai"],
        subject: "Alert",
        text: "Body",
      }),
    );
  });

  it("sends order, shipping, and fulfillment-failure emails when configured", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "ColorDrop <orders@colordrop.ai>";
    sendMock.mockResolvedValue({ error: null });

    const {
      sendOrderConfirmation,
      sendShippingNotification,
      sendFulfillmentFailureCustomerEmail,
    } = await import("@/lib/email");

    const orderResult = await sendOrderConfirmation({
      to: "buyer@example.com",
      orderId: "ord_1",
      orderShortId: "ord_1",
      amountTotalCents: 2500,
      bookTitle: "Book",
      pageCount: 24,
    });
    const shippingResult = await sendShippingNotification({
      to: "buyer@example.com",
      orderId: "ord_1",
      orderShortId: "ord_1",
      trackingUrl: "https://carrier.test/track",
      trackingId: "track_1",
    });
    const failureResult = await sendFulfillmentFailureCustomerEmail({
      to: "buyer@example.com",
      orderShortId: "ord_1",
      bookTitle: "Book",
      paymentRefunded: true,
    });

    expect(orderResult).toEqual({ ok: true });
    expect(shippingResult).toEqual({ ok: true });
    expect(failureResult).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(3);
  });
});
