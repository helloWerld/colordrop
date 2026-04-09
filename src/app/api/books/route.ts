import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getOrCreateUserProfile } from "@/lib/db";
import {
  BOOK_PRODUCTS,
  getPodPackageId,
  isPageTier,
  isTrimSizeId,
  type TrimSizeId,
} from "@/lib/book-products";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; trim_size_id?: string; page_tier?: number } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // no body
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";

  const trimSizeId =
    typeof body.trim_size_id === "string" ? body.trim_size_id : "large";
  const pageTier = typeof body.page_tier === "number" ? body.page_tier : 24;

  if (!isTrimSizeId(trimSizeId)) {
    return NextResponse.json(
      { error: "Invalid trim size. Use pocket, medium, or large." },
      { status: 400 },
    );
  }
  if (!isPageTier(pageTier)) {
    return NextResponse.json(
      { error: "Invalid page tier. Use 12, 24, 32, 48, 64, or 128." },
      { status: 400 },
    );
  }

  const product = BOOK_PRODUCTS[trimSizeId as TrimSizeId];

  try {
    await getOrCreateUserProfile(userId);
  } catch (e) {
    console.error("getOrCreateUserProfile", e);
    return NextResponse.json(
      { error: "Failed to ensure user profile" },
      { status: 500 },
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: book, error } = await supabase
    .from("books")
    .insert({
      user_id: userId,
      status: "draft",
      title,
      trim_size: product.trimCode,
      pod_package_id: getPodPackageId(trimSizeId as TrimSizeId, pageTier),
      page_tier: pageTier,
      page_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("insert book", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 },
    );
  }

  return NextResponse.json({ book });
}
