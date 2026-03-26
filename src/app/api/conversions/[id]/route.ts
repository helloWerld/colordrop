import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_conversions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Not found or already deleted" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { collection_id?: string | null } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const collectionId = body.collection_id === null || body.collection_id === ""
    ? null
    : typeof body.collection_id === "string" ? body.collection_id.trim() || null : undefined;

  if (collectionId === undefined) {
    return NextResponse.json(
      { error: "collection_id is required (string or null)" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  if (collectionId !== null) {
    const { data: coll } = await supabase
      .from("collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", userId)
      .single();
    if (!coll) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("saved_conversions")
    .update({ collection_id: collectionId })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Conversion not found or update failed" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    id: data.id,
    collection_id: data.collection_id ?? undefined,
  });
}
