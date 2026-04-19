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
    const { getAdminEmailAllowlist, isAdminEmail, collectNormalizedVerifiedEmails } =
      await import("@/lib/admin-auth");

    expect(getAdminEmailAllowlist()).toEqual([
      "admin@example.com",
      "ops@example.com",
    ]);
    expect(isAdminEmail("ADMIN@example.com")).toBe(true);
    expect(isAdminEmail("nope@example.com")).toBe(false);
    expect(
      collectNormalizedVerifiedEmails({
        primaryEmailAddress: {
          emailAddress: "A@Example.com",
          verification: { status: "verified" },
        },
        emailAddresses: [],
      }),
    ).toEqual(["a@example.com"]);
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

  it("authorizes when a non-primary verified email matches the allowlist", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    authMock.mockResolvedValue({ userId: "user_1" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: {
        emailAddress: "member@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        {
          emailAddress: "member@example.com",
          verification: { status: "verified" },
        },
        {
          emailAddress: "admin@example.com",
          verification: { status: "verified" },
        },
      ],
    });
    const { requireAdminApi } = await import("@/lib/admin-auth");

    const response = await requireAdminApi();
    expect("status" in response).toBe(false);
    expect(response).toEqual({
      userId: "user_1",
      email: "admin@example.com",
    });
  });

  it("returns forbidden when only an unverified address matches the allowlist", async () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com";
    authMock.mockResolvedValue({ userId: "user_1" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: {
        emailAddress: "member@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        {
          emailAddress: "member@example.com",
          verification: { status: "verified" },
        },
        {
          emailAddress: "admin@example.com",
          verification: { status: "unverified" },
        },
      ],
    });
    const { requireAdminApi } = await import("@/lib/admin-auth");

    const response = await requireAdminApi();
    expect("status" in response && response.status).toBe(403);
  });
});
