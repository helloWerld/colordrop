import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const currentUserMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

vi.mock("@/lib/lulu", () => ({
  isLuluSandbox: () => true,
}));

vi.mock("@/lib/stripe", () => ({
  isStripeTestMode: () => false,
}));

describe("GET /api/config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue({ userId: null });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated but not admin", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    authMock.mockResolvedValue({ userId: "user_1" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "member@example.com" },
      emailAddresses: [],
    });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns sandbox flags for admin", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    authMock.mockResolvedValue({ userId: "admin_1" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: {
        emailAddress: "admin@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [],
    });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      luluSandbox: boolean;
      stripeTestMode: boolean;
    };
    expect(body.luluSandbox).toBe(true);
    expect(body.stripeTestMode).toBe(false);
  });
});
