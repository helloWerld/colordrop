import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  BOOK_LOCKED_FOR_EDITING_ERROR,
  isBookLockedForEditing,
} from "@/lib/print-snapshot";

type CropRect = { x?: number; y?: number; width?: number; height?: number };

function isValidCropRect(v: unknown): v is CropRect {
  if (v === null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.x != null && typeof o.x !== "number") return false;
  if (o.y != null && typeof o.y !== "number") return false;
  if (o.width != null && typeof o.width !== "number") return false;
  if (o.height != null && typeof o.height !== "number") return false;
  return true;
}

function isValidRotation(v: unknown): boolean {
  return v === null || v === undefined || [0, 90, 180, 270].includes(Number(v));
}

/**
 * PATCH: update crop_rect and/or rotation_degrees for a page.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; pageId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId, pageId } = await params;
  let body: { crop_rect?: unknown; rotation_degrees?: unknown } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: {
    crop_rect?: CropRect | null;
    rotation_degrees?: number | null;
  } = {};
  if (body.crop_rect !== undefined) {
    if (!isValidCropRect(body.crop_rect) && body.crop_rect !== null) {
      return NextResponse.json(
        {
          error:
            "crop_rect must be an object with optional x, y, width, height (0-1) or null",
        },
        { status: 400 },
      );
    }
    updates.crop_rect = body.crop_rect as CropRect | null;
  }
  if (body.rotation_degrees !== undefined) {
    if (!isValidRotation(body.rotation_degrees)) {
      return NextResponse.json(
        { error: "rotation_degrees must be 0, 90, 180, or 270" },
        { status: 400 },
      );
    }
    updates.rotation_degrees =
      body.rotation_degrees === null || body.rotation_degrees === undefined
        ? null
        : Number(body.rotation_degrees);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Provide crop_rect and/or rotation_degrees" },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (await isBookLockedForEditing(supabase, bookId)) {
    return NextResponse.json(
      { error: BOOK_LOCKED_FOR_EDITING_ERROR },
      { status: 409 },
    );
  }

  const { data: page, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", pageId)
    .eq("book_id", bookId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 },
    );
  }
  return NextResponse.json({ page });
}

/**
 * DELETE a page from a book. Re-sequences remaining pages and updates book.page_count.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; pageId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId, pageId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (bookErr || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (await isBookLockedForEditing(supabase, bookId)) {
    return NextResponse.json(
      { error: BOOK_LOCKED_FOR_EDITING_ERROR },
      { status: 409 },
    );
  }

  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("book_id", bookId)
    .single();

  if (pageErr || !page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const { error: deleteErr } = await supabase
    .from("pages")
    .delete()
    .eq("id", pageId)
    .eq("book_id", bookId);

  if (deleteErr) {
    console.error("Delete page error", deleteErr);
    return NextResponse.json(
      { error: "Failed to remove page" },
      { status: 500 },
    );
  }

  const { data: remaining } = await supabase
    .from("pages")
    .select("id")
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const newCount = remaining?.length ?? 0;

  for (let i = 0; i < (remaining ?? []).length; i++) {
    await supabase
      .from("pages")
      .update({ position: i + 1 })
      .eq("id", remaining![i].id);
  }

  await supabase
    .from("books")
    .update({
      page_count: newCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  return NextResponse.json({ ok: true, page_count: newCount });
}
