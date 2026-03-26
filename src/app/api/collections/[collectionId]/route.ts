import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collectionId } = await params;
  let body: { name?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Collection name is required." },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", collectionId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Collection not found or update failed" },
      { status: 404 }
    );
  }
  return NextResponse.json({ collection: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collectionId } = await params;
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
