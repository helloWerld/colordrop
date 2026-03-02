import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * DELETE a page from a book. Re-sequences remaining pages and updates
 * book.page_count and book.credits_applied_value_cents (subtract removed page's credit_value_cents).
 * PRD §4.8, §8.7.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; pageId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId, pageId } = await params;
  const supabase = createServerSupabaseClient();

  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("id, page_count, credits_applied_value_cents")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (bookErr || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("id, credit_value_cents")
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
    return NextResponse.json({ error: "Failed to remove page" }, { status: 500 });
  }

  const { data: remaining } = await supabase
    .from("pages")
    .select("id, credit_value_cents")
    .eq("book_id", bookId)
    .order("position", { ascending: true });

  const newCount = remaining?.length ?? 0;
  const newCreditsCents = (remaining ?? []).reduce(
    (sum, p) => sum + (p.credit_value_cents ?? 0),
    0
  );

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
      credits_applied_value_cents: newCreditsCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  return NextResponse.json({ ok: true, page_count: newCount });
}
