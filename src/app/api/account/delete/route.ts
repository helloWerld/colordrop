import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Delete account and purge associated data. PRD §4.1, §10.2.
 * Retains only what is legally required (e.g. order records anonymized, not removed).
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  await supabase.from("saved_conversions").delete().eq("user_id", userId);
  await supabase.from("credit_transactions").delete().eq("user_id", userId);

  const { data: booksWithOrders } = await supabase
    .from("orders")
    .select("book_id")
    .eq("user_id", userId);
  const bookIdsToKeep = (booksWithOrders ?? []).map((r) => r.book_id).filter(Boolean);

  if (bookIdsToKeep.length > 0) {
    await supabase
      .from("books")
      .update({ user_id: `deleted_${userId.slice(0, 12)}` })
      .in("id", bookIdsToKeep);
  }

  await supabase.from("books").delete().eq("user_id", userId);
  await supabase
    .from("orders")
    .update({ user_id: `deleted_${userId.slice(0, 12)}` })
    .eq("user_id", userId);
  await supabase.from("user_profiles").delete().eq("user_id", userId);

  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch (e) {
    console.error("Clerk deleteUser failed", e);
    return NextResponse.json(
      { error: "Data purged but account deletion failed. Contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
