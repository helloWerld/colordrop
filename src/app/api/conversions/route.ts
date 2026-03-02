import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_conversions")
    .select("id, outline_image_path, conversion_context, stylization, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("conversions GET", error);
    return NextResponse.json(
      { error: "Failed to load conversions" },
      { status: 500 }
    );
  }

  const conversions = (data ?? []).map((row) => ({
    id: row.id,
    outline_image_path: row.outline_image_path,
    conversion_context: row.conversion_context,
    stylization: row.stylization,
    created_at: row.created_at,
  }));

  return NextResponse.json({ conversions });
}
