import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getOrCreateUserProfile } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await getOrCreateUserProfile(userId);
  } catch (e) {
    console.error("getOrCreateUserProfile", e);
    return NextResponse.json(
      { error: "Failed to ensure user profile" },
      { status: 500 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: book, error } = await supabase
    .from("books")
    .insert({
      user_id: userId,
      status: "draft",
      title: "My Coloring Book",
      trim_size: "0850X0850",
      pod_package_id: "0850X0850BWSTDPB060UW444MXX",
      page_count: 0,
      credits_applied_value_cents: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("insert book", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }

  return NextResponse.json({ book });
}
