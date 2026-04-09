/**
 * Print snapshot: book + pages + cover frozen at Stripe webhook (payment) time.
 * Fulfillment reads this JSON instead of live tables when present.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getTrimSizeIdFromCode } from "@/lib/book-products";
import type { PageRow } from "@/lib/pdf";

export const BOOK_LOCKED_FOR_EDITING_ERROR =
  "This book has been ordered or is in fulfillment. Editing is not allowed.";

const cropRectSchema = z
  .object({
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .nullable()
  .optional();

const snapshotPageSchema = z.object({
  outline_image_path: z.string(),
  crop_rect: cropRectSchema,
  rotation_degrees: z.number().nullable().optional(),
});

const snapshotCoverSchema = z.object({
  image_path: z.string(),
  crop_rect: cropRectSchema,
  rotation_degrees: z.number().nullable().optional(),
});

const snapshotBookSchema = z.object({
  title: z.string(),
  page_count: z.number(),
  page_tier: z.number(),
  trim_size: z.string(),
});

export const printSnapshotV1Schema = z.object({
  version: z.literal(1),
  book: snapshotBookSchema,
  pages: z.array(snapshotPageSchema),
  cover: snapshotCoverSchema,
});

export type PrintSnapshotV1 = z.infer<typeof printSnapshotV1Schema>;

/** True if the book has a non-refunded order (paid or in pipeline). */
export async function isBookLockedForEditing(
  supabase: SupabaseClient,
  bookId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("book_id", bookId)
    .neq("status", "refunded")
    .limit(1)
    .maybeSingle();
  return !!data;
}

export function parsePrintSnapshot(
  json: unknown,
): PrintSnapshotV1 | null {
  const r = printSnapshotV1Schema.safeParse(json);
  return r.success ? r.data : null;
}

/**
 * Same structural checks as fulfillment uses for live book data.
 * Returns an error message or null if valid.
 */
export function validatePrintSnapshotForFulfillment(
  snapshot: PrintSnapshotV1,
): string | null {
  const pageRows = snapshot.pages.filter((p) => p.outline_image_path);
  if (pageRows.length < 2) {
    return "Book has fewer than 2 pages";
  }
  if (!snapshot.cover?.image_path) {
    return "Cover not found";
  }
  const trimCode = snapshot.book.trim_size ?? "";
  const trimSizeId = getTrimSizeIdFromCode(trimCode);
  if (!trimSizeId) {
    return "Book trim size is missing or not supported for printing";
  }
  const interiorPageCount = pageRows.length;
  const dbPageCount = snapshot.book.page_count ?? 0;
  if (interiorPageCount !== dbPageCount) {
    return `Interior page count (${interiorPageCount}) does not match book.page_count (${dbPageCount})`;
  }
  const pageTier = snapshot.book.page_tier ?? dbPageCount;
  if (interiorPageCount !== pageTier) {
    return `Interior page count (${interiorPageCount}) does not match book.page_tier (${pageTier})`;
  }
  return null;
}

export function snapshotPagesToPageRows(snapshot: PrintSnapshotV1): PageRow[] {
  return snapshot.pages
    .filter((p) => p.outline_image_path)
    .map((p) => ({
      outline_image_path: p.outline_image_path,
      crop_rect: p.crop_rect ?? undefined,
      rotation_degrees: p.rotation_degrees ?? undefined,
    }));
}

export async function buildPrintSnapshotFromDb(
  supabase: SupabaseClient,
  bookId: string,
): Promise<{ ok: true; snapshot: PrintSnapshotV1 } | { ok: false; error: string }> {
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("title, page_count, page_tier, trim_size")
    .eq("id", bookId)
    .single();

  if (bookErr || !book) {
    return { ok: false, error: "Book not found" };
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("outline_image_path, crop_rect, rotation_degrees")
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const { data: cover } = await supabase
    .from("covers")
    .select("image_path, crop_rect, rotation_degrees")
    .eq("book_id", bookId)
    .single();

  if (!cover?.image_path) {
    return { ok: false, error: "Cover not found" };
  }

  const pageRows = (pages ?? []).filter((p) => p.outline_image_path);
  const snapshot: PrintSnapshotV1 = {
    version: 1,
    book: {
      title: book.title ?? "My Coloring Book",
      page_count: book.page_count ?? 0,
      page_tier: book.page_tier ?? 24,
      trim_size: book.trim_size ?? "",
    },
    pages: pageRows.map((p) => ({
      outline_image_path: p.outline_image_path,
      crop_rect: p.crop_rect ?? null,
      rotation_degrees: p.rotation_degrees ?? null,
    })),
    cover: {
      image_path: cover.image_path,
      crop_rect: cover.crop_rect ?? null,
      rotation_degrees: cover.rotation_degrees ?? null,
    },
  };

  const err = validatePrintSnapshotForFulfillment(snapshot);
  if (err) return { ok: false, error: err };
  return { ok: true, snapshot };
}
