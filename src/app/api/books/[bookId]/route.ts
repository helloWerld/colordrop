import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  BOOK_LOCKED_FOR_EDITING_ERROR,
  isBookLockedForEditing,
} from "@/lib/print-snapshot";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: pages } = await supabase
    .from("pages")
    .select(
      "id, position, outline_image_path, conversion_status, credit_value_cents, crop_rect, rotation_degrees",
    )
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const pagesWithUrls = await Promise.all(
    (pages ?? []).map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("outlines")
        .createSignedUrl(p.outline_image_path, 3600);
      return { ...p, outline_url: signed?.signedUrl ?? null };
    }),
  );

  const { data: cover } = await supabase
    .from("covers")
    .select("id, image_path, crop_rect, rotation_degrees")
    .eq("book_id", bookId)
    .single();

  let coverWithUrl: {
    id: string;
    image_path: string;
    crop_rect?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    } | null;
    rotation_degrees?: number | null;
    cover_url?: string | null;
  } | null = cover ?? null;
  if (cover?.image_path) {
    const { data: coverSigned } = await supabase.storage
      .from("covers")
      .createSignedUrl(cover.image_path, 3600);
    coverWithUrl = { ...cover, cover_url: coverSigned?.signedUrl ?? null };
  }

  return NextResponse.json({
    book,
    pages: pagesWithUrls,
    cover: coverWithUrl,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  let body: { title?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(
      { error: "Book name is required." },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  if (await isBookLockedForEditing(supabase, bookId)) {
    return NextResponse.json(
      { error: BOOK_LOCKED_FOR_EDITING_ERROR },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("books")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", bookId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Book not found or update failed" },
      { status: 404 },
    );
  }
  return NextResponse.json({ book: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("book_id", bookId)
    .limit(1)
    .maybeSingle();

  if (order) {
    return NextResponse.json(
      { error: "Cannot delete a book that has an order." },
      { status: 409 },
    );
  }

  await supabase.from("books").delete().eq("id", bookId).eq("user_id", userId);
  return new NextResponse(null, { status: 204 });
}
