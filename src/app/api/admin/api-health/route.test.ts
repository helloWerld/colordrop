import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const { requireAdminApiMock, registryMock } = vi.hoisted(() => ({
  requireAdminApiMock: vi.fn(),
  registryMock: [
    {
      id: "probe-ok",
      method: "GET",
      pathPattern: "/api/health",
      category: "health",
      expectedAuth: "public",
      probePolicy: { probe: true as const, expectedStatuses: [200] },
    },
    {
      id: "skip-side-effects",
      method: "POST",
      pathPattern: "/api/checkout",
      category: "authenticated",
      expectedAuth: "requires_auth",
      probePolicy: { probe: false as const, reason: "side_effects" as const },
    },
  ],
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminApi: requireAdminApiMock,
}));

vi.mock("@/lib/api-endpoints-registry", () => ({
  API_ENDPOINT_REGISTRY: registryMock,
}));

describe("GET /api/admin/api-health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns auth response when not admin", async () => {
    requireAdminApiMock.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );
    const response = await GET(new Request("http://localhost/api/admin/api-health"));
    expect(response.status).toBe(403);
  });

  it("returns normalized health payload with summary", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );

    const response = await GET(new Request("http://localhost/api/admin/api-health"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      total: number;
      summary: Record<string, number>;
      checks: Array<{ id: string; state: string; reason?: string; httpStatus?: number }>;
    };

    expect(body.total).toBe(2);
    expect(body.summary.ok).toBe(1);
    expect(body.summary.skipped).toBe(1);
    expect(body.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "probe-ok",
          state: "ok",
          httpStatus: 200,
        }),
        expect.objectContaining({
          id: "skip-side-effects",
          state: "skipped",
          reason: "side_effects",
        }),
      ]),
    );
  });
});

