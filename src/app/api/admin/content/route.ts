import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "40"), 100);

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_conversions")
    .select("id, user_id, original_image_path, outline_image_path, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = await Promise.all(
    (data ?? []).map(async (row) => {
      const original = await supabase.storage
        .from("originals")
        .createSignedUrl(row.original_image_path, 60 * 30);
      const outline = await supabase.storage
        .from("outlines")
        .createSignedUrl(row.outline_image_path, 60 * 30);
      return {
        ...row,
        original_url: original.data?.signedUrl ?? null,
        outline_url: outline.data?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json({ content: items });
}
