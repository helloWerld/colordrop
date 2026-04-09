import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("orders")
    .select(
      "id, book_id, user_id, status, lulu_status, stripe_checkout_session_id, stripe_payment_intent_id, stripe_refund_id, lulu_print_job_id, amount_total, currency, shipping_name, shipping_city, shipping_state, shipping_country, shipping_level, lulu_tracking_id, lulu_tracking_url, error_message, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(
      [
        `id.ilike.%${q}%`,
        `book_id.ilike.%${q}%`,
        `user_id.ilike.%${q}%`,
        `stripe_checkout_session_id.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [] });
}
