import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const q = (searchParams.get("q") ?? "").trim();
  const severity = searchParams.get("severity");
  const limit = Math.min(Number(searchParams.get("limit") ?? "200"), 500);

  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("integration_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (provider) query = query.eq("provider", provider);
  if (severity) query = query.eq("severity", severity);
  if (q) {
    query = query.or(
      [
        `event_type.ilike.%${q}%`,
        `status.ilike.%${q}%`,
        `error_message.ilike.%${q}%`,
        `order_id.ilike.%${q}%`,
        `stripe_session_id.ilike.%${q}%`,
        `payload->>targetUserId.ilike.%${q}%`,
        `payload->>adminUserId.ilike.%${q}%`,
        `payload->>adminEmail.ilike.%${q}%`,
        `payload->>reason.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ logs: data ?? [] });
}
