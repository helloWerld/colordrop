import { createServerSupabaseClient } from "./supabase";

export async function getOrCreateUserProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) return existing;

  const { data: inserted, error } = await supabase
    .from("user_profiles")
    .insert({
      user_id: userId,
      free_conversions_remaining: 5,
      credits_single: 0,
      credits_pack_50: 0,
      credits_pack_100: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return inserted;
}
