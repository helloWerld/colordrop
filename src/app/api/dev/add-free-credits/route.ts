import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getOrCreateUserProfile } from "@/lib/db";

const ADD_CREDITS = 20;

/**
 * Dev-only: add free credits to the current user for testing.
 * Only works when NODE_ENV=development. Requires auth.
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOrCreateUserProfile(userId);
  const current = profile.free_conversions_remaining ?? 0;
  const next = current + ADD_CREDITS;

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({
      free_conversions_remaining: next,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("add-free-credits", error);
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }

  return NextResponse.json({
    added: ADD_CREDITS,
    free_remaining: next,
    message: `Added ${ADD_CREDITS} free credits. You now have ${next} free credits.`,
  });
}
