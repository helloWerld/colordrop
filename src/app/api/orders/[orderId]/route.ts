import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  const supabase = createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      book_id,
      amount_total,
      status,
      created_at,
      credits_applied_value_cents,
      shipping_name,
      shipping_address_line1,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      shipping_level,
      lulu_tracking_id,
      lulu_tracking_url
    `)
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: book } = await supabase
    .from("books")
    .select("id, title, page_count")
    .eq("id", order.book_id)
    .single();

  return NextResponse.json({ order: { ...order, book: book ?? null } });
}
