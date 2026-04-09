import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("isStripeTestMode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("STRIPE_USE_SANDBOX", undefined);
    vi.stubEnv("STRIPE_SECRET_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_STRIPE_SANDBOX_PUBLISHABLE_KEY", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true when STRIPE_USE_SANDBOX=true regardless of live secret prefix", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_xxx");
    const { isStripeTestMode } = await import("./stripe");
    expect(isStripeTestMode()).toBe(true);
  });

  it("is false when STRIPE_USE_SANDBOX=false even if secret is sk_test_", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "false");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_xxx");
    const { isStripeTestMode } = await import("./stripe");
    expect(isStripeTestMode()).toBe(false);
  });

  it("is true when secret key is sk_test_ (legacy, flag unset)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_xxx");
    const { isStripeTestMode } = await import("./stripe");
    expect(isStripeTestMode()).toBe(true);
  });

  it("is false when secret key is sk_live_ (legacy, flag unset)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_xxx");
    const { isStripeTestMode } = await import("./stripe");
    expect(isStripeTestMode()).toBe(false);
  });

  it("falls back to publishable pk_test_ when secret unset (legacy)", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_xxx");
    const { isStripeTestMode } = await import("./stripe");
    expect(isStripeTestMode()).toBe(true);
  });

  it("uses NEXT_PUBLIC_STRIPE_SANDBOX_PUBLISHABLE_KEY when legacy secret unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_SANDBOX_PUBLISHABLE_KEY", "pk_test_xxx");
    const { isStripeTestMode } = await import("./stripe");
    expect(isStripeTestMode()).toBe(true);
  });
});

describe("getStripeWebhookSecret", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("STRIPE_USE_SANDBOX", undefined);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", undefined);
    vi.stubEnv("STRIPE_SANDBOX_WEBHOOK_SECRET", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns STRIPE_WEBHOOK_SECRET when not in sandbox mode", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "false");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_live");
    const { getStripeWebhookSecret } = await import("./stripe");
    expect(getStripeWebhookSecret()).toBe("whsec_live");
  });

  it("returns STRIPE_SANDBOX_WEBHOOK_SECRET when STRIPE_USE_SANDBOX=true", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "true");
    vi.stubEnv("STRIPE_SANDBOX_WEBHOOK_SECRET", "whsec_test");
    const { getStripeWebhookSecret } = await import("./stripe");
    expect(getStripeWebhookSecret()).toBe("whsec_test");
  });

  it("throws when sandbox mode but sandbox webhook secret missing", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "true");
    const { getStripeWebhookSecret } = await import("./stripe");
    expect(() => getStripeWebhookSecret()).toThrow(
      "STRIPE_SANDBOX_WEBHOOK_SECRET"
    );
  });
});

describe("stripeDashboardPaymentDeepLink", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("STRIPE_USE_SANDBOX", undefined);
    vi.stubEnv("STRIPE_SECRET_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("NEXT_PUBLIC_STRIPE_SANDBOX_PUBLISHABLE_KEY", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when no ids", async () => {
    const { stripeDashboardPaymentDeepLink } = await import("./stripe");
    expect(stripeDashboardPaymentDeepLink({})).toBeNull();
  });

  it("prefers payment intent over checkout session", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "true");
    const { stripeDashboardPaymentDeepLink } = await import("./stripe");
    expect(
      stripeDashboardPaymentDeepLink({
        paymentIntentId: "pi_abc",
        checkoutSessionId: "cs_xyz",
      }),
    ).toBe("https://dashboard.stripe.com/test/payments/pi_abc");
  });

  it("uses checkout session when payment intent missing", async () => {
    vi.stubEnv("STRIPE_USE_SANDBOX", "false");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_xxx");
    const { stripeDashboardPaymentDeepLink } = await import("./stripe");
    expect(
      stripeDashboardPaymentDeepLink({
        checkoutSessionId: "cs_live_123",
      }),
    ).toBe("https://dashboard.stripe.com/payments/cs_live_123");
  });
});
