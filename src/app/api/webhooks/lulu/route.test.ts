import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () =>
    new Map<string, string>([
      ["x-lulu-signature", "sha256=deadbeef"],
    ]) as unknown as Headers,
}));

const supabaseUpdateMock = vi.fn();
const supabaseEqMock = vi.fn();
const supabaseSelectMock = vi.fn();
const supabaseLimitMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      select: supabaseSelectMock,
      update: supabaseUpdateMock,
    }),
    storage: { from: () => ({ remove: vi.fn() }) },
  }),
}));

vi.mock("@/lib/lulu", () => ({
  getPrintJobStatus: vi.fn(async () => null),
}));

vi.mock("@/lib/email", () => ({
  getEmailForUserId: vi.fn(async () => null),
  sendShippingNotification: vi.fn(async () => undefined),
}));

vi.mock("@/lib/integration-events", () => ({
  logIntegrationEvent: vi.fn(async () => undefined),
}));

describe("POST /api/webhooks/lulu", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.LULU_WEBHOOK_SECRET;
    process.env.NODE_ENV = "test";

    supabaseSelectMock.mockReturnValue({ eq: supabaseEqMock });
    supabaseEqMock.mockReturnValue({ limit: supabaseLimitMock });
    supabaseLimitMock.mockResolvedValue({ data: [], error: null });
    supabaseUpdateMock.mockReturnValue({ eq: vi.fn() });
  });

  it("returns 500 in production when secret is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.LULU_WEBHOOK_SECRET;

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/webhooks/lulu", {
      method: "POST",
      body: JSON.stringify({ print_job_id: 123, status: "SHIPPED" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns 400 in production when signature is invalid", async () => {
    process.env.NODE_ENV = "production";
    process.env.LULU_WEBHOOK_SECRET = "secret";

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/webhooks/lulu", {
      method: "POST",
      body: JSON.stringify({ print_job_id: 123, status: "SHIPPED" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

