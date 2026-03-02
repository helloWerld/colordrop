import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  let body: { pageIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const pageIds = body.pageIds;
  if (!Array.isArray(pageIds) || pageIds.length === 0) {
    return NextResponse.json(
      { error: "pageIds must be a non-empty array" },
      { status: 400 }
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

  for (let i = 0; i < pageIds.length; i++) {
    await supabase
      .from("pages")
      .update({ position: i + 1 })
      .eq("id", pageIds[i])
      .eq("book_id", bookId);
  }

  return NextResponse.json({ ok: true });
}
