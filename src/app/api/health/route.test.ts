import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/production-env-check", () => ({
  checkProductionEnv: () => ({ ready: true, warnings: [] }),
}));

const supabaseFromMock = vi.fn();
const supabaseSelectMock = vi.fn();
const supabaseLimitMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: () => ({
    from: supabaseFromMock,
  }),
}));

const stripeBalanceRetrieveMock = vi.fn();
const stripeUseSandboxMock = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    balance: { retrieve: stripeBalanceRetrieveMock },
  }),
  stripeUseSandbox: () => stripeUseSandboxMock(),
}));

const luluDiagMock = vi.fn();
const luluHealthCheckMock = vi.fn();

vi.mock("@/lib/lulu", () => ({
  getLuluCredentialDiagnostics: () => luluDiagMock(),
  luluHealthCheck: () => luluHealthCheckMock(),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.NODE_ENV = "test";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SANDBOX_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SANDBOX_WEBHOOK_SECRET;
    delete process.env.LULU_CLIENT_KEY;
    delete process.env.LULU_CLIENT_SECRET;
    delete process.env.LULU_SANDBOX_CLIENT_KEY;
    delete process.env.LULU_SANDBOX_CLIENT_SECRET;
    delete process.env.LULU_WEBHOOK_SECRET;
    delete process.env.CRON_SECRET;

    // Supabase query chain: from().select().limit()
    supabaseFromMock.mockReturnValue({ select: supabaseSelectMock });
    supabaseSelectMock.mockReturnValue({ limit: supabaseLimitMock });
  });

  it("returns 503 when critical env is missing", async () => {
    stripeUseSandboxMock.mockReturnValue(false);
    luluDiagMock.mockReturnValue({
      activeKeysSet: false,
      activeMode: "production",
    });
    process.env.NODE_ENV = "production";

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { ok: boolean; checks: { env: { ok: boolean; missing: string[] } } };
    expect(body.ok).toBe(false);
    expect(body.checks.env.ok).toBe(false);
    expect(body.checks.env.missing).toEqual(
      expect.arrayContaining([
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "LULU_CLIENT_KEY",
        "LULU_CLIENT_SECRET",
        "LULU_WEBHOOK_SECRET",
        "CRON_SECRET",
      ]),
    );
  });

  it("returns 200 when all checks pass", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.LULU_CLIENT_KEY = "lulu_key";
    process.env.LULU_CLIENT_SECRET = "lulu_secret";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    process.env.LULU_WEBHOOK_SECRET = "lulu_webhook_secret";
    process.env.CRON_SECRET = "cron_secret";

    stripeUseSandboxMock.mockReturnValue(false);
    luluDiagMock.mockReturnValue({
      activeKeysSet: true,
      activeMode: "production",
    });

    supabaseLimitMock.mockResolvedValue({ error: null });
    stripeBalanceRetrieveMock.mockResolvedValue({});
    luluHealthCheckMock.mockResolvedValue({ ok: true });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; checks: { supabase: { ok: boolean }; stripe: { ok: boolean }; lulu: { ok: boolean } } };
    expect(body.ok).toBe(true);
    expect(body.checks.supabase.ok).toBe(true);
    expect(body.checks.stripe.ok).toBe(true);
    expect(body.checks.lulu.ok).toBe(true);
  });

  it("returns 503 when a dependency check fails", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role_key";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.LULU_CLIENT_KEY = "lulu_key";
    process.env.LULU_CLIENT_SECRET = "lulu_secret";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    process.env.LULU_WEBHOOK_SECRET = "lulu_webhook_secret";
    process.env.CRON_SECRET = "cron_secret";

    stripeUseSandboxMock.mockReturnValue(false);
    luluDiagMock.mockReturnValue({
      activeKeysSet: true,
      activeMode: "production",
    });

    supabaseLimitMock.mockResolvedValue({ error: null });
    stripeBalanceRetrieveMock.mockRejectedValue(new Error("stripe down"));
    luluHealthCheckMock.mockResolvedValue({ ok: true });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { ok: boolean; checks: { stripe: { ok: boolean; error?: string } } };
    expect(body.ok).toBe(false);
    expect(body.checks.stripe.ok).toBe(false);
    expect(body.checks.stripe.error).toContain("stripe down");
  });
});

