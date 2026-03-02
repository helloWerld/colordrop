import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const bucket = searchParams.get("bucket") ?? "outlines";
  if (!path || !["originals", "outlines", "covers"].includes(bucket)) {
    return NextResponse.json({ error: "Invalid path or bucket" }, { status: 400 });
  }
  if (!path.startsWith(userId + "/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (!data?.signedUrl) {
    return NextResponse.json({ error: "Failed to create URL" }, { status: 500 });
  }
  return NextResponse.json({ url: data.signedUrl });
}
