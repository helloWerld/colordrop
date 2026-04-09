import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, ORIGINAL_RETENTION_DAYS } from "./route";

const mockLt = vi.fn(() => Promise.resolve({ data: [], error: null }));

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        in: () => ({
          lt: mockLt,
        }),
      }),
    }),
  })),
}));

describe("GET /api/cron/cleanup-originals auth", () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv;
    if (origCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = origCronSecret;
    }
    vi.restoreAllMocks();
  });

  it("production: missing CRON_SECRET returns 500", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CRON_SECRET;

    const res = await GET(new Request("http://localhost/api/cron/cleanup-originals"));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Cron secret not configured");
  });

  it("production: wrong bearer returns 401", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "secret-value";

    const res = await GET(
      new Request("http://localhost/api/cron/cleanup-originals", {
        headers: { Authorization: "Bearer wrong" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("production: missing Authorization returns 401", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "secret-value";

    const res = await GET(new Request("http://localhost/api/cron/cleanup-originals"));
    expect(res.status).toBe(401);
  });

  it("production: correct bearer proceeds", async () => {
    process.env.NODE_ENV = "production";
    process.env.CRON_SECRET = "secret-value";

    const res = await GET(
      new Request("http://localhost/api/cron/cleanup-originals", {
        headers: { Authorization: "Bearer secret-value" },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number; message?: string };
    expect(body.deleted).toBe(0);
    expect(body.message).toBe("No orders to cleanup");
  });

  it("non-production: no auth proceeds", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.CRON_SECRET;

    const res = await GET(new Request("http://localhost/api/cron/cleanup-originals"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: number; message?: string };
    expect(body.deleted).toBe(0);
    expect(body.message).toBe("No orders to cleanup");
  });
});

describe("retention period", () => {
  it("exports ORIGINAL_RETENTION_DAYS as 180", () => {
    expect(ORIGINAL_RETENTION_DAYS).toBe(180);
  });

  it("queries orders with a cutoff ~180 days in the past", async () => {
    process.env.NODE_ENV = "development";
    mockLt.mockClear();

    await GET(new Request("http://localhost/api/cron/cleanup-originals"));

    expect(mockLt).toHaveBeenCalledTimes(1);
    const cutoffArg = mockLt.mock.calls[0][1] as string;
    const cutoffDate = new Date(cutoffArg);
    const expectedCutoff = new Date();
    expectedCutoff.setDate(expectedCutoff.getDate() - 180);
    const diffMs = Math.abs(cutoffDate.getTime() - expectedCutoff.getTime());
    expect(diffMs).toBeLessThan(5000);
  });
});
