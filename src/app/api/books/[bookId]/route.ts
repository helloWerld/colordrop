import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> }
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
    .select("id, position, outline_image_path, conversion_status, credit_value_cents")
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const pagesWithUrls = await Promise.all(
    (pages ?? []).map(async (p) => {
      const { data: signed } = await supabase.storage
        .from("outlines")
        .createSignedUrl(p.outline_image_path, 3600);
      return { ...p, outline_url: signed?.signedUrl ?? null };
    })
  );

  const { data: cover } = await supabase
    .from("covers")
    .select("id, image_path")
    .eq("book_id", bookId)
    .single();

  let coverWithUrl: { id: string; image_path: string; cover_url?: string | null } | null = cover ?? null;
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
