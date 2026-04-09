import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  BOOK_LOCKED_FOR_EDITING_ERROR,
  isBookLockedForEditing,
} from "@/lib/print-snapshot";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, page_tier")
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

  const maxPages = book.page_tier ?? 128;

  let body: { saved_conversion_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.saved_conversion_id) {
    const { data: conv } = await supabase
      .from("saved_conversions")
      .select("original_image_path, outline_image_path")
      .eq("id", body.saved_conversion_id)
      .eq("user_id", userId)
      .single();
    if (!conv) {
      return NextResponse.json(
        { error: "Saved conversion not found" },
        { status: 404 },
      );
    }
    const { count } = await supabase
      .from("pages")
      .select("id", { count: "exact", head: true })
      .eq("book_id", bookId);
    const position = (count ?? 0) + 1;
    if (position > maxPages) {
      return NextResponse.json(
        {
          error: `This book has a maximum of ${maxPages} pages (${maxPages} images). Remove a page to add another.`,
        },
        { status: 400 },
      );
    }
    const { data: page, error: pageErr } = await supabase
      .from("pages")
      .insert({
        book_id: bookId,
        position,
        saved_conversion_id: body.saved_conversion_id,
        original_image_path: conv.original_image_path,
        outline_image_path: conv.outline_image_path,
        conversion_status: "completed",
        credit_value_cents: null,
      })
      .select()
      .single();
    if (pageErr) {
      return NextResponse.json(
        { error: "Failed to add page" },
        { status: 500 },
      );
    }
    await supabase
      .from("books")
      .update({
        page_count: position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookId);
    const { data: signed } = await supabase.storage
      .from("outlines")
      .createSignedUrl(page.outline_image_path, 3600);
    return NextResponse.json({
      page: { ...page, outline_url: signed?.signedUrl ?? null },
    });
  }

  return NextResponse.json(
    { error: "Send saved_conversion_id to add from library" },
    { status: 400 },
  );
}
