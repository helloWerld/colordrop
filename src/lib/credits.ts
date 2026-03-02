import { createServerSupabaseClient } from "./supabase";

const CREDIT_VALUES = {
  single: 25,
  pack_50: 20,
  pack_100: 15,
} as const;

export type DeductResult =
  | { ok: true; creditValueCents: number | null }
  | { ok: false; code: "INSUFFICIENT_CREDITS" };

/**
 * Check if user has any credits (free or purchased).
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("free_conversions_remaining, credits_single, credits_pack_50, credits_pack_100")
    .eq("user_id", userId)
    .single();
  if (!data) return false;
  const total =
    (data.free_conversions_remaining ?? 0) +
    (data.credits_single ?? 0) +
    (data.credits_pack_50 ?? 0) +
    (data.credits_pack_100 ?? 0);
  return total > 0;
}

/**
 * Deduct one credit. Book flow: use most expensive first (single → pack_50 → pack_100), return value for checkout.
 * One-off flow: use cheapest first (pack_100 → pack_50 → single), return null.
 */
export async function deductCredit(
  userId: string,
  context: "book" | "one_off"
): Promise<DeductResult> {
  const supabase = createServerSupabaseClient();

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("id, free_conversions_remaining, credits_single, credits_pack_50, credits_pack_100")
    .eq("user_id", userId)
    .single();

  if (fetchError || !profile) {
    return { ok: false, code: "INSUFFICIENT_CREDITS" };
  }

  const free = profile.free_conversions_remaining ?? 0;
  const single = profile.credits_single ?? 0;
  const pack50 = profile.credits_pack_50 ?? 0;
  const pack100 = profile.credits_pack_100 ?? 0;

  if (free > 0) {
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        free_conversions_remaining: free - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (updateError) return { ok: false, code: "INSUFFICIENT_CREDITS" };
    return { ok: true, creditValueCents: null };
  }

  if (context === "book") {
    if (single > 0) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          credits_single: single - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return { ok: false, code: "INSUFFICIENT_CREDITS" };
      return { ok: true, creditValueCents: CREDIT_VALUES.single };
    }
    if (pack50 > 0) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          credits_pack_50: pack50 - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return { ok: false, code: "INSUFFICIENT_CREDITS" };
      return { ok: true, creditValueCents: CREDIT_VALUES.pack_50 };
    }
    if (pack100 > 0) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          credits_pack_100: pack100 - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return { ok: false, code: "INSUFFICIENT_CREDITS" };
      return { ok: true, creditValueCents: CREDIT_VALUES.pack_100 };
    }
  } else {
    if (pack100 > 0) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          credits_pack_100: pack100 - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return { ok: false, code: "INSUFFICIENT_CREDITS" };
      return { ok: true, creditValueCents: null };
    }
    if (pack50 > 0) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          credits_pack_50: pack50 - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return { ok: false, code: "INSUFFICIENT_CREDITS" };
      return { ok: true, creditValueCents: null };
    }
    if (single > 0) {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          credits_single: single - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return { ok: false, code: "INSUFFICIENT_CREDITS" };
      return { ok: true, creditValueCents: null };
    }
  }

  return { ok: false, code: "INSUFFICIENT_CREDITS" };
}
