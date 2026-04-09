import { describe, expect, it, vi } from "vitest";
import {
  buildPrintSnapshotFromDb,
  isBookLockedForEditing,
  parsePrintSnapshot,
  printSnapshotV1Schema,
  snapshotPagesToPageRows,
  validatePrintSnapshotForFulfillment,
} from "./print-snapshot";

describe("parsePrintSnapshot", () => {
  it("accepts a valid v1 snapshot", () => {
    const raw = {
      version: 1 as const,
      book: {
        title: "T",
        page_count: 2,
        page_tier: 2,
        trim_size: "0700X1000",
      },
      pages: [
        {
          outline_image_path: "a.png",
          crop_rect: null,
          rotation_degrees: null,
        },
        {
          outline_image_path: "b.png",
          crop_rect: null,
          rotation_degrees: null,
        },
      ],
      cover: {
        image_path: "c.jpg",
        crop_rect: null,
        rotation_degrees: null,
      },
    };
    expect(parsePrintSnapshot(raw)).toEqual(printSnapshotV1Schema.parse(raw));
  });

  it("returns null for invalid shape", () => {
    expect(parsePrintSnapshot({ version: 2 })).toBeNull();
    expect(parsePrintSnapshot(null)).toBeNull();
  });
});

describe("validatePrintSnapshotForFulfillment", () => {
  const base = (): Parameters<typeof validatePrintSnapshotForFulfillment>[0] => ({
    version: 1,
    book: {
      title: "T",
      page_count: 2,
      page_tier: 2,
      trim_size: "0700X1000",
    },
    pages: [
      { outline_image_path: "a.png", crop_rect: null, rotation_degrees: null },
      { outline_image_path: "b.png", crop_rect: null, rotation_degrees: null },
    ],
    cover: {
      image_path: "c.jpg",
      crop_rect: null,
      rotation_degrees: null,
    },
  });

  it("returns null when valid", () => {
    expect(validatePrintSnapshotForFulfillment(base())).toBeNull();
  });

  it("errors when fewer than 2 pages", () => {
    const s = base();
    s.pages = [s.pages[0]!];
    s.book.page_count = 1;
    s.book.page_tier = 1;
    expect(validatePrintSnapshotForFulfillment(s)).toMatch(/fewer than 2/);
  });

  it("errors when trim unsupported", () => {
    const s = base();
    s.book.trim_size = "INVALID";
    expect(validatePrintSnapshotForFulfillment(s)).toMatch(/trim size/);
  });
});

describe("snapshotPagesToPageRows", () => {
  it("maps snapshot pages to PageRow", () => {
    const s = printSnapshotV1Schema.parse({
      version: 1,
      book: {
        title: "T",
        page_count: 2,
        page_tier: 2,
        trim_size: "0700X1000",
      },
      pages: [
        {
          outline_image_path: "x.png",
          crop_rect: { x: 0, y: 0, width: 1, height: 1 },
          rotation_degrees: 90,
        },
        {
          outline_image_path: "y.png",
          crop_rect: null,
          rotation_degrees: null,
        },
      ],
      cover: { image_path: "c.jpg", crop_rect: null, rotation_degrees: null },
    });
    const rows = snapshotPagesToPageRows(s);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.outline_image_path).toBe("x.png");
    expect(rows[0]?.rotation_degrees).toBe(90);
  });
});

describe("isBookLockedForEditing", () => {
  it("returns true when a non-refunded order row exists", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "order-1" },
      error: null,
    });
    const limit = vi.fn().mockReturnValue({ maybeSingle });
    const neq = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ neq });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as never;

    await expect(isBookLockedForEditing(supabase, "book-1")).resolves.toBe(
      true,
    );
    expect(from).toHaveBeenCalledWith("orders");
    expect(eq).toHaveBeenCalledWith("book_id", "book-1");
    expect(neq).toHaveBeenCalledWith("status", "refunded");
  });

  it("returns false when no matching order", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const limit = vi.fn().mockReturnValue({ maybeSingle });
    const neq = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ neq });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as never;

    await expect(isBookLockedForEditing(supabase, "book-1")).resolves.toBe(
      false,
    );
  });
});

describe("buildPrintSnapshotFromDb", () => {
  it("returns error when book missing", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "n" } });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as never;

    const r = await buildPrintSnapshotFromDb(supabase, "b1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Book not found");
  });
});
