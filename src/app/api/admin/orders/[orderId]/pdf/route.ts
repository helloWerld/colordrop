import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24h for viewing in browser

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const admin = await requireAdminApi();
  if (admin instanceof NextResponse) return admin;

  const { orderId } = await params;
  const { searchParams } = new URL(request.url);
  const kindRaw = searchParams.get("kind") ?? "interior";
  const kind = kindRaw === "cover" ? "cover" : "interior";

  const supabase = createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, interior_pdf_path, cover_pdf_path")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const path =
    kind === "cover" ? order.cover_pdf_path : order.interior_pdf_path;
  if (!path) {
    return NextResponse.json({ error: "PDF not available yet" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("pdfs")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not create download link" },
      { status: 502 },
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
