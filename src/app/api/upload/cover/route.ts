import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  BOOK_LOCKED_FOR_EDITING_ERROR,
  isBookLockedForEditing,
} from "@/lib/print-snapshot";
import { checkUploadLimit } from "@/lib/rate-limit";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  UPLOAD_CONSENT_FORM_FIELD,
  validateImageDimensions,
} from "@/lib/validators";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = checkUploadLimit(userId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      {
        status: 429,
        headers: limit.retryAfter
          ? { "Retry-After": String(limit.retryAfter) }
          : {},
      },
    );
  }

  const formData = await request.formData();
  const consent = formData.get(UPLOAD_CONSENT_FORM_FIELD);
  if (consent !== "true") {
    return NextResponse.json(
      {
        error:
          "You must confirm the upload agreement (rights, Terms & Privacy) before uploading.",
      },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  const bookId = formData.get("book_id") as string | null;
  if (!file || !(file instanceof File) || !bookId) {
    return NextResponse.json(
      { error: "Missing file or book_id" },
      { status: 400 },
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("user_id", userId)
    .single();
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (await isBookLockedForEditing(supabase, bookId)) {
    return NextResponse.json(
      { error: BOOK_LOCKED_FOR_EDITING_ERROR },
      { status: 409 },
    );
  }

  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 20 MB." },
      { status: 400 },
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${userId}/${bookId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensionError = validateImageDimensions(buffer);
  if (dimensionError) {
    return NextResponse.json({ error: dimensionError }, { status: 400 });
  }

  const { error: uploadErr } = await supabase.storage
    .from("covers")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("covers")
    .select("id")
    .eq("book_id", bookId)
    .single();

  if (existing) {
    await supabase
      .from("covers")
      .update({
        image_path: path,
        crop_rect: null,
        rotation_degrees: null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("covers").insert({ book_id: bookId, image_path: path });
  }

  return NextResponse.json({ path });
}
