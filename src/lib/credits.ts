import { createServerSupabaseClient } from "./supabase";

export type BucketUsed = "free" | "paid";

export type DeductResult =
  | { ok: true; creditValueCents: null; bucketUsed: BucketUsed }
  | { ok: false; code: "INSUFFICIENT_CREDITS" };

/**
 * Check if user has any credits (free or paid).
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("free_conversions_remaining, paid_credits")
    .eq("user_id", userId)
    .single();
  if (!data) return false;
  const total =
    (data.free_conversions_remaining ?? 0) + (data.paid_credits ?? 0);
  return total > 0;
}

/**
 * Deduct one credit. Uses free first, then paid.
 * Conversion credits cannot be applied toward book purchases; creditValueCents is always null.
 */
export async function deductCredit(userId: string): Promise<DeductResult> {
  const supabase = createServerSupabaseClient();

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("id, free_conversions_remaining, paid_credits")
    .eq("user_id", userId)
    .single();

  if (fetchError || !profile) {
    return { ok: false, code: "INSUFFICIENT_CREDITS" };
  }

  const free = profile.free_conversions_remaining ?? 0;
  const paid = profile.paid_credits ?? 0;

  if (free > 0) {
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        free_conversions_remaining: free - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (updateError) return { ok: false, code: "INSUFFICIENT_CREDITS" };
    return { ok: true, creditValueCents: null, bucketUsed: "free" };
  }

  if (paid > 0) {
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        paid_credits: paid - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (updateError) return { ok: false, code: "INSUFFICIENT_CREDITS" };
    return { ok: true, creditValueCents: null, bucketUsed: "paid" };
  }

  return { ok: false, code: "INSUFFICIENT_CREDITS" };
}

/**
 * Refund one credit to the same bucket that was used in a prior deductCredit.
 * Call this when conversion fails after a successful deduction.
 */
export async function refundCredit(
  userId: string,
  deductResult: { ok: true; bucketUsed: BucketUsed }
): Promise<void> {
  if (!deductResult.ok) return;
  const supabase = createServerSupabaseClient();
  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("id, free_conversions_remaining, paid_credits")
    .eq("user_id", userId)
    .single();
  if (fetchError || !profile) return;
  const { bucketUsed } = deductResult;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (bucketUsed === "free") {
    const free = profile.free_conversions_remaining ?? 0;
    updates.free_conversions_remaining = free + 1;
  } else {
    const paid = profile.paid_credits ?? 0;
    updates.paid_credits = paid + 1;
  }
  await supabase.from("user_profiles").update(updates).eq("id", profile.id);
}
