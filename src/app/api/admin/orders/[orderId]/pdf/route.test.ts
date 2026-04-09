import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { GET } from "./route";

const { requireAdminApiMock, createServerSupabaseClientMock } = vi.hoisted(
  () => ({
    requireAdminApiMock: vi.fn(),
    createServerSupabaseClientMock: vi.fn(),
  }),
);

vi.mock("@/lib/admin-auth", () => ({
  requireAdminApi: requireAdminApiMock,
}));

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

function mockSupabaseForOrderPdf(opts: {
  order: {
    id: string;
    interior_pdf_path: string | null;
    cover_pdf_path: string | null;
  } | null;
  orderError?: { message: string } | null;
  signedUrl?: string | null;
  signError?: { message: string } | null;
}) {
  const storageFrom = vi.fn().mockReturnValue({
    createSignedUrl: vi.fn().mockResolvedValue({
      data: opts.signedUrl ? { signedUrl: opts.signedUrl } : null,
      error: opts.signError ?? null,
    }),
  });

  const ordersChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: opts.order,
      error: opts.orderError ?? null,
    }),
  };

  createServerSupabaseClientMock.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "orders") return ordersChain;
      throw new Error(`unexpected table ${table}`);
    }),
    storage: { from: storageFrom },
  });

  return { ordersChain, storageFrom };
}

describe("GET /api/admin/orders/[orderId]/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when not admin", async () => {
    requireAdminApiMock.mockResolvedValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const response = await GET(
      new Request("http://localhost/api/admin/orders/o1/pdf"),
      { params: Promise.resolve({ orderId: "o1" }) },
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 when order missing", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    mockSupabaseForOrderPdf({ order: null, orderError: { message: "not found" } });

    const response = await GET(
      new Request("http://localhost/api/admin/orders/o1/pdf"),
      { params: Promise.resolve({ orderId: "o1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when interior path missing", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    mockSupabaseForOrderPdf({
      order: {
        id: "o1",
        interior_pdf_path: null,
        cover_pdf_path: "orders/o1/cover.pdf",
      },
    });

    const response = await GET(
      new Request("http://localhost/api/admin/orders/o1/pdf"),
      { params: Promise.resolve({ orderId: "o1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("redirects to signed interior URL", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    mockSupabaseForOrderPdf({
      order: {
        id: "o1",
        interior_pdf_path: "orders/o1/interior.pdf",
        cover_pdf_path: null,
      },
      signedUrl: "https://signed.example/interior",
    });

    const response = await GET(
      new Request("http://localhost/api/admin/orders/o1/pdf"),
      { params: Promise.resolve({ orderId: "o1" }) },
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe("https://signed.example/interior");
  });

  it("redirects to signed cover URL when kind=cover", async () => {
    requireAdminApiMock.mockResolvedValue({ userId: "admin_1", email: "admin@test.com" });
    mockSupabaseForOrderPdf({
      order: {
        id: "o1",
        interior_pdf_path: "orders/o1/interior.pdf",
        cover_pdf_path: "orders/o1/cover.pdf",
      },
      signedUrl: "https://signed.example/cover",
    });

    const response = await GET(
      new Request("http://localhost/api/admin/orders/o1/pdf?kind=cover"),
      { params: Promise.resolve({ orderId: "o1" }) },
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toBe("https://signed.example/cover");
  });
});
