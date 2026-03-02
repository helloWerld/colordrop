import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, book_id, amount_total, status, created_at, credits_applied_value_cents")
    .eq("stripe_checkout_session_id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !order) {
    return NextResponse.json({ order: null });
  }
  return NextResponse.json({ order });
}
