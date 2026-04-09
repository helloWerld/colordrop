import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function stubAllEnv(overrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string | undefined> = {
    NODE_ENV: "production",
    STRIPE_USE_SANDBOX: undefined,
    LULU_USE_SANDBOX: undefined,
    STRIPE_SECRET_KEY: "sk_live_abc",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_abc",
    STRIPE_WEBHOOK_SECRET: "whsec_live",
    LULU_CLIENT_KEY: "lulu-key",
    LULU_CLIENT_SECRET: "lulu-secret",
    LULU_API_BASE_URL: "https://api.lulu.com",
    LULU_WEBHOOK_SECRET: "lulu-webhook-secret",
    RESEND_API_KEY: "re_abc",
    CRON_SECRET: "cron-secret",
    NEXT_PUBLIC_APP_URL: "https://colordrop.ai",
  };
  const merged = { ...defaults, ...overrides };
  for (const [key, val] of Object.entries(merged)) {
    vi.stubEnv(key, val);
  }
}

describe("checkProductionEnv", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ready when all production vars are correct", async () => {
    stubAllEnv();
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.ready).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("warns when STRIPE_SECRET_KEY is a test key in production", async () => {
    stubAllEnv({ STRIPE_SECRET_KEY: "sk_test_xyz" });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.ready).toBe(false);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("sk_live_")]),
    );
  });

  it("warns when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a test key", async () => {
    stubAllEnv({ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_xyz" });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.ready).toBe(false);
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("pk_live_")]),
    );
  });

  it("skips Stripe live-key checks when STRIPE_USE_SANDBOX=true", async () => {
    stubAllEnv({
      STRIPE_USE_SANDBOX: "true",
      STRIPE_SECRET_KEY: "sk_test_xyz",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_xyz",
      STRIPE_WEBHOOK_SECRET: undefined,
    });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    const stripeWarnings = result.warnings.filter((w) =>
      w.includes("STRIPE"),
    );
    expect(stripeWarnings).toHaveLength(0);
  });

  it("warns when LULU_CLIENT_KEY or LULU_CLIENT_SECRET missing in production", async () => {
    stubAllEnv({ LULU_CLIENT_KEY: undefined, LULU_CLIENT_SECRET: undefined });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("LULU_CLIENT_KEY"),
        expect.stringContaining("LULU_CLIENT_SECRET"),
      ]),
    );
  });

  it("warns when LULU_API_BASE_URL points to sandbox without flag", async () => {
    stubAllEnv({ LULU_API_BASE_URL: "https://api.sandbox.lulu.com" });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("sandbox")]),
    );
  });

  it("skips Lulu live checks when LULU_USE_SANDBOX=true", async () => {
    stubAllEnv({
      LULU_USE_SANDBOX: "true",
      LULU_CLIENT_KEY: undefined,
      LULU_CLIENT_SECRET: undefined,
      LULU_API_BASE_URL: "https://api.sandbox.lulu.com",
    });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    const luluWarnings = result.warnings.filter(
      (w) => w.includes("LULU_CLIENT") || w.includes("LULU_API_BASE_URL"),
    );
    expect(luluWarnings).toHaveLength(0);
  });

  it("warns when LULU_WEBHOOK_SECRET missing in production", async () => {
    stubAllEnv({ LULU_WEBHOOK_SECRET: undefined });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("LULU_WEBHOOK_SECRET")]),
    );
  });

  it("warns when RESEND_API_KEY missing", async () => {
    stubAllEnv({ RESEND_API_KEY: undefined });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("RESEND_API_KEY")]),
    );
  });

  it("warns when CRON_SECRET missing in production", async () => {
    stubAllEnv({ CRON_SECRET: undefined });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("CRON_SECRET")]),
    );
  });

  it("warns when NEXT_PUBLIC_APP_URL missing", async () => {
    stubAllEnv({ NEXT_PUBLIC_APP_URL: undefined });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("NEXT_PUBLIC_APP_URL")]),
    );
  });

  it("is lenient in development (non-production NODE_ENV)", async () => {
    stubAllEnv({
      NODE_ENV: "development",
      STRIPE_SECRET_KEY: "sk_test_xyz",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_xyz",
      LULU_CLIENT_KEY: undefined,
      LULU_CLIENT_SECRET: undefined,
      LULU_WEBHOOK_SECRET: undefined,
      CRON_SECRET: undefined,
    });
    const { checkProductionEnv } = await import("./production-env-check");
    const result = checkProductionEnv();
    const prodOnlyWarnings = result.warnings.filter(
      (w) =>
        w.includes("sk_live_") ||
        w.includes("pk_live_") ||
        w.includes("LULU_CLIENT") ||
        w.includes("LULU_WEBHOOK") ||
        w.includes("CRON_SECRET"),
    );
    expect(prodOnlyWarnings).toHaveLength(0);
  });
});
