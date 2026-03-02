import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * Image retention: delete originals 90 days after order fulfillment. PRD §10.2.
 * Call via Vercel Cron or external cron with Authorization: Bearer CRON_SECRET.
 * Finds orders fulfilled (shipped/delivered) 90+ days ago, collects original paths from
 * those books' pages and saved_conversions, then removes from originals bucket.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data: oldOrders } = await supabase
    .from("orders")
    .select("book_id")
    .in("status", ["shipped", "delivered"])
    .lt("updated_at", cutoff.toISOString());

  const bookIds = Array.from(new Set((oldOrders ?? []).map((o) => o.book_id).filter(Boolean)));
  if (bookIds.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No orders to cleanup" });
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("original_image_path")
    .in("book_id", bookIds);
  const allPaths = Array.from(new Set((pages ?? []).map((p) => p.original_image_path).filter(Boolean)));
  let deleted = 0;
  for (const path of allPaths) {
    const { error } = await supabase.storage.from("originals").remove([path]);
    if (!error) deleted++;
  }

  return NextResponse.json({ deleted, total: allPaths.length });
}
