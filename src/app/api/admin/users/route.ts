import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getEmailForUserId } from "@/lib/email";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, free_conversions_remaining, paid_credits, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = await Promise.all(
    (data ?? []).map(async (row) => ({
      ...row,
      email: await getEmailForUserId(row.user_id),
    })),
  );
  const filtered = q
    ? rows.filter(
        (row) =>
          row.user_id.toLowerCase().includes(q) ||
          (row.email ?? "").toLowerCase().includes(q),
      )
    : rows;

  return NextResponse.json({ users: filtered });
}
