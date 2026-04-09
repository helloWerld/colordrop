import { describe, expect, it, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const currentUserMock = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

describe("admin-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
  });

  it("parses allowlist and normalizes values", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = " Admin@Example.com,ops@example.com ";
    const { getAdminEmailAllowlist, isAdminEmail } = await import(
      "@/lib/admin-auth"
    );

    expect(getAdminEmailAllowlist()).toEqual([
      "admin@example.com",
      "ops@example.com",
    ]);
    expect(isAdminEmail("ADMIN@example.com")).toBe(true);
    expect(isAdminEmail("nope@example.com")).toBe(false);
  });

  it("returns unauthorized when user is missing", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    authMock.mockResolvedValue({ userId: null });
    const { requireAdminApi } = await import("@/lib/admin-auth");

    const response = await requireAdminApi();
    expect("status" in response && response.status).toBe(401);
  });

  it("returns forbidden when email is not in allowlist", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    authMock.mockResolvedValue({ userId: "user_1" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "member@example.com" },
      emailAddresses: [],
    });
    const { requireAdminApi } = await import("@/lib/admin-auth");

    const response = await requireAdminApi();
    expect("status" in response && response.status).toBe(403);
  });
});
