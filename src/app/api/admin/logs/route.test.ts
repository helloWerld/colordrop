import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const {
  requireAdminApiMock,
  createServerSupabaseClientMock,
} = vi.hoisted(() => ({
  requireAdminApiMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminApi: requireAdminApiMock,
}));

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

describe("GET /api/admin/logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auth response when not admin", async () => {
    requireAdminApiMock.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await GET(new Request("http://localhost/api/admin/logs"));
    expect(response.status).toBe(403);
  });

  it("applies q search across admin credit-grant payload fields", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    const orMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const query = {
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      or: orMock,
    };
    createServerSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => query),
      })),
    });

    const response = await GET(
      new Request("http://localhost/api/admin/logs?q=support"),
    );
    expect(response.status).toBe(200);
    expect(orMock).toHaveBeenCalledWith(
      expect.stringContaining("payload->>targetUserId.ilike.%support%"),
    );
    expect(orMock).toHaveBeenCalledWith(
      expect.stringContaining("payload->>adminEmail.ilike.%support%"),
    );
    expect(orMock).toHaveBeenCalledWith(
      expect.stringContaining("payload->>reason.ilike.%support%"),
    );
  });
});
