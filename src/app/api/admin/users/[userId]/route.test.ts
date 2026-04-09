import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET, POST } from "./route";

const {
  requireAdminApiMock,
  createServerSupabaseClientMock,
  getAdminUserCockpitDataMock,
  logIntegrationEventMock,
} = vi.hoisted(() => ({
  requireAdminApiMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
  getAdminUserCockpitDataMock: vi.fn(),
  logIntegrationEventMock: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminApi: requireAdminApiMock,
}));

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/admin-user-cockpit", () => ({
  getAdminUserCockpitData: getAdminUserCockpitDataMock,
}));

vi.mock("@/lib/integration-events", () => ({
  logIntegrationEvent: logIntegrationEventMock,
}));

describe("GET /api/admin/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerSupabaseClientMock.mockReturnValue({});
  });

  it("returns auth response when not admin", async () => {
    requireAdminApiMock.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await GET(new Request("http://localhost"), {
      params: { userId: "user_1" },
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 when user is not found", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    createServerSupabaseClientMock.mockReturnValue({});
    getAdminUserCockpitDataMock.mockRejectedValue(new Error("USER_NOT_FOUND"));

    const response = await GET(new Request("http://localhost"), {
      params: { userId: "missing_user" },
    });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("User not found");
  });

  it("returns aggregated payload for valid user", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    createServerSupabaseClientMock.mockReturnValue({});
    getAdminUserCockpitDataMock.mockResolvedValue({
      user: {
        user_id: "user_1",
        email: "user@test.com",
        free_conversions_remaining: 1,
        paid_credits: 10,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      orders: [],
      books: [],
      conversions: [],
      content: [],
      events: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: { userId: "user_1" },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.user_id).toBe("user_1");
    expect(Array.isArray(body.orders)).toBe(true);
    expect(Array.isArray(body.events)).toBe(true);
  });
});

function mockUserProfilesSupabase(opts: {
  profile: {
    user_id: string;
    free_conversions_remaining: number;
    paid_credits: number;
  } | null;
  selectError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const maybeSingle = vi.fn(() =>
    Promise.resolve({
      data: opts.profile,
      error: opts.selectError ?? null,
    }),
  );
  const updateEq = vi.fn(() =>
    Promise.resolve({ error: opts.updateError ?? null }),
  );
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    })),
    update: vi.fn(() => ({
      eq: updateEq,
    })),
  }));
  return { from, maybeSingle, updateEq };
}

describe("POST /api/admin/users/[userId] (add free credits)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerSupabaseClientMock.mockReturnValue({});
    vi.spyOn(console, "info").mockImplementation(() => {});
    logIntegrationEventMock.mockResolvedValue(undefined);
  });

  it("returns auth response when not admin", async () => {
    requireAdminApiMock.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 5 }),
      }),
      { params: { userId: "user_1" } },
    );

    expect(response.status).toBe(403);
  });

  it("returns 400 for invalid JSON", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      }),
      { params: { userId: "user_1" } },
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when creditsToAdd is not an integer", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });

    for (const body of [
      { creditsToAdd: 1.5 },
      { creditsToAdd: "3" },
      {},
    ]) {
      const response = await POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        { params: { userId: "user_1" } },
      );
      expect(response.status).toBe(400);
    }
  });

  it("returns 400 when creditsToAdd is out of range", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });

    for (const n of [0, -1, 101]) {
      const response = await POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditsToAdd: n }),
        }),
        { params: { userId: "user_1" } },
      );
      expect(response.status).toBe(400);
    }
  });

  it("returns 400 when reason is not a string", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 1, reason: 99 }),
      }),
      { params: { userId: "user_1" } },
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when user profile is missing", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });
    const { from } = mockUserProfilesSupabase({ profile: null });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 2 }),
      }),
      { params: { userId: "missing" } },
    );
    expect(response.status).toBe(404);
  });

  it("returns 500 on select error", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });
    const { from } = mockUserProfilesSupabase({
      profile: null,
      selectError: { message: "db down" },
    });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 1 }),
      }),
      { params: { userId: "user_1" } },
    );
    expect(response.status).toBe(500);
  });

  it("returns 500 on update error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });
    const { from } = mockUserProfilesSupabase({
      profile: {
        user_id: "user_1",
        free_conversions_remaining: 2,
        paid_credits: 0,
      },
      updateError: { message: "write failed" },
    });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 3 }),
      }),
      { params: { userId: "user_1" } },
    );
    expect(response.status).toBe(500);
  });

  it("increments free credits and returns balances", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });
    const { from, updateEq } = mockUserProfilesSupabase({
      profile: {
        user_id: "user_1",
        free_conversions_remaining: 2,
        paid_credits: 5,
      },
    });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 4, reason: "goodwill" }),
      }),
      { params: { userId: "user_1" } },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.free_conversions_remaining).toBe(6);
    expect(body.paid_credits).toBe(5);
    expect(updateEq).toHaveBeenCalledWith("user_id", "user_1");
    expect(logIntegrationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "system",
        eventType: "admin.free_credits_granted",
        severity: "info",
        status: "success",
        payload: expect.objectContaining({
          targetUserId: "user_1",
          adminUserId: "admin_1",
          adminEmail: "admin@test.com",
          creditsAdded: 4,
          freeRemainingAfter: 6,
          reason: "goodwill",
        }),
      }),
      expect.anything(),
    );
  });

  it("still succeeds when integration event logging fails", async () => {
    requireAdminApiMock.mockResolvedValue({
      userId: "admin_1",
      email: "admin@test.com",
    });
    logIntegrationEventMock.mockRejectedValue(new Error("log down"));
    const { from } = mockUserProfilesSupabase({
      profile: {
        user_id: "user_1",
        free_conversions_remaining: 1,
        paid_credits: 2,
      },
    });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsToAdd: 2, reason: "support" }),
      }),
      { params: { userId: "user_1" } },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.free_conversions_remaining).toBe(3);
  });
});
