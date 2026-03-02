import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getOrCreateUserProfile } from "@/lib/db";
import { deductCredit } from "@/lib/credits";
import { runLineartWithRetry } from "@/lib/replicate";
import { runLineartOpenAIFallback } from "@/lib/openai-fallback";
import { checkConversionLimit } from "@/lib/rate-limit";
import { convertBodySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = convertBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { storage_path, stylization, conversion_context, book_id } = parsed.data;

  const supabase = createServerSupabaseClient();
  if (conversion_context === "book" && book_id) {
    const { data: bookRow } = await supabase
      .from("books")
      .select("id, page_count")
      .eq("id", book_id)
      .eq("user_id", userId)
      .single();
    if (bookRow && (bookRow.page_count ?? 0) >= 50) {
      return NextResponse.json(
        { error: "Book has maximum 50 pages. Remove a page to add another." },
        { status: 400 }
      );
    }
  }

  const convLimit = checkConversionLimit(userId);
  if (!convLimit.ok) {
    return NextResponse.json(
      { error: "Too many conversions this hour. Please try again later." },
      { status: 429, headers: convLimit.retryAfter ? { "Retry-After": String(convLimit.retryAfter) } : {} }
    );
  }

  await getOrCreateUserProfile(userId);
  const deductResult = await deductCredit(userId, conversion_context);
  if (!deductResult.ok) {
    return NextResponse.json(
      { code: "INSUFFICIENT_CREDITS", message: "No conversion credits left. Buy more credits." },
      { status: 402 }
    );
  }

  const { data: signed } = await supabase.storage
    .from("originals")
    .createSignedUrl(storage_path, 3600);
  if (!signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not get image URL" },
      { status: 400 }
    );
  }

  let outlineImageUrl: string;
  try {
    outlineImageUrl = await runLineartWithRetry(signed.signedUrl, stylization);
  } catch (e) {
    console.error("Replicate conversion failed", e);
    if (process.env.OPENAI_API_KEY) {
      try {
        outlineImageUrl = await runLineartOpenAIFallback(signed.signedUrl, stylization);
      } catch (fallbackErr) {
        console.error("OpenAI fallback failed", fallbackErr);
        return NextResponse.json(
          { error: "Conversion failed. Please try again." },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Conversion failed. Please try again." },
        { status: 502 }
      );
    }
  }

  const outlinePath = `${userId}/${crypto.randomUUID()}.png`;
  const imageRes = await fetch(outlineImageUrl);
  if (!imageRes.ok) {
    return NextResponse.json(
      { error: "Failed to save converted image" },
      { status: 502 }
    );
  }
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("outlines")
    .upload(outlinePath, imageBuffer, { contentType: "image/png", upsert: false });

  if (uploadError) {
    console.error("Outline upload error", uploadError);
    return NextResponse.json(
      { error: "Failed to save converted image" },
      { status: 500 }
    );
  }

  const { data: savedConversion, error: insertError } = await supabase
    .from("saved_conversions")
    .insert({
      user_id: userId,
      original_image_path: storage_path,
      outline_image_path: outlinePath,
      conversion_context,
      stylization,
    })
    .select("id")
    .single();

  if (insertError || !savedConversion) {
    console.error("saved_conversions insert", insertError);
    return NextResponse.json(
      { error: "Failed to save conversion" },
      { status: 500 }
    );
  }

  let pageId: string | null = null;
  if (conversion_context === "book" && book_id) {
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", book_id)
      .eq("user_id", userId)
      .single();
    if (book) {
      const { count } = await supabase
        .from("pages")
        .select("id", { count: "exact", head: true })
        .eq("book_id", book_id);
      const position = (count ?? 0) + 1;
      const { data: page, error: pageError } = await supabase
        .from("pages")
        .insert({
          book_id,
          position,
          original_image_path: storage_path,
          outline_image_path: outlinePath,
          conversion_status: "completed",
          credit_value_cents: deductResult.creditValueCents,
        })
        .select("id")
        .single();
      if (!pageError && page) {
        pageId = page.id;
        const { data: pages } = await supabase
          .from("pages")
          .select("credit_value_cents")
          .eq("book_id", book_id);
        const sum = (pages ?? []).reduce((s, p) => s + (p.credit_value_cents ?? 0), 0);
        await supabase
          .from("books")
          .update({
            page_count: position,
            credits_applied_value_cents: sum,
            updated_at: new Date().toISOString(),
          })
          .eq("id", book_id);
      }
    }
  }

  const { data: outlineSigned } = await supabase.storage
    .from("outlines")
    .createSignedUrl(outlinePath, 3600);

  return NextResponse.json({
    saved_conversion_id: savedConversion.id,
    outline_url: outlineSigned?.signedUrl ?? null,
    page_id: pageId ?? undefined,
    credit_value_cents: deductResult.creditValueCents ?? undefined,
  });
}
