import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/** How long after fulfillment (shipped/delivered) before original images are deleted. */
export const ORIGINAL_RETENTION_DAYS = 180;

/**
 * Image retention: delete originals after fulfillment per retention policy.
 * Call via Vercel Cron or external cron with Authorization: Bearer CRON_SECRET.
 * Finds orders fulfilled (shipped/delivered) 180+ days ago, collects original
 * image paths from those books' pages, then removes from the originals bucket.
 */
export async function GET(request: Request) {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (isProd) {
    if (!secret) {
      console.error("CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 },
      );
    }
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServerSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ORIGINAL_RETENTION_DAYS);

  const { data: oldOrders } = await supabase
    .from("orders")
    .select("book_id")
    .in("status", ["shipped", "delivered"])
    .lt("updated_at", cutoff.toISOString());

  const bookIds = Array.from(
    new Set((oldOrders ?? []).map((o) => o.book_id).filter(Boolean)),
  );
  if (bookIds.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No orders to cleanup" });
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("original_image_path")
    .in("book_id", bookIds);
  const allPaths = Array.from(
    new Set((pages ?? []).map((p) => p.original_image_path).filter(Boolean)),
  );
  let deleted = 0;
  for (const path of allPaths) {
    const { error } = await supabase.storage.from("originals").remove([path]);
    if (!error) deleted++;
  }

  return NextResponse.json({ deleted, total: allPaths.length });
}
