import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { calculateBookPrice, SHIPPING_LEVELS } from "@/lib/pricing";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;
  const { searchParams } = new URL(request.url);
  const shippingLevel = (searchParams.get("shipping_level") ?? "MAIL") as "MAIL" | "PRIORITY_MAIL" | "EXPEDITED";

  const supabase = createServerSupabaseClient();
  const { data: book, error } = await supabase
    .from("books")
    .select("id, page_count, credits_applied_value_cents")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();

  if (error || !book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const pageCount = book.page_count ?? 0;
  const creditsApplied = book.credits_applied_value_cents ?? 0;
  const breakdown = calculateBookPrice(pageCount, shippingLevel, creditsApplied);

  return NextResponse.json({
    page_count: pageCount,
    shipping_level: shippingLevel,
    shipping_options: SHIPPING_LEVELS,
    ...breakdown,
  });
}
