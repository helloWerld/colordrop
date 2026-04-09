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
 * PATCH: update crop_rect and/or rotation_degrees for the book's cover.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
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

  const { data: cover, error } = await supabase
    .from("covers")
    .update(updates)
    .eq("book_id", bookId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update cover" },
      { status: 500 },
    );
  }
  return NextResponse.json({ cover });
}
