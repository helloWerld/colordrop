import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getOrCreateUserProfile } from "@/lib/db";
import { deductCredit, refundCredit } from "@/lib/credits";
import { runLineartWithFallback } from "@/lib/convert";
import { checkConversionLimit } from "@/lib/rate-limit";
import { convertBodySchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    return await handleConvert(request);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[pages/convert] Unhandled error", errMsg, e);
    const safe = errMsg.length <= 200 && !/token|key|secret|password|auth/i.test(errMsg) ? errMsg : "";
    return NextResponse.json(
      { error: safe ? `Conversion failed: ${safe}` : "Conversion failed. Please try again." },
      { status: 502 }
    );
  }
}

async function handleConvert(request: Request) {
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

  const { storage_path, conversion_context, book_id } = parsed.data;

  const supabase = createServerSupabaseClient();
  if (conversion_context === "book" && book_id) {
    const { data: bookRow } = await supabase
      .from("books")
      .select("id, page_count, page_tier")
      .eq("id", book_id)
      .eq("user_id", userId)
      .single();
    const maxPages = bookRow?.page_tier ?? 128;
    if (bookRow && (bookRow.page_count ?? 0) >= maxPages) {
      return NextResponse.json(
        { error: `This book has a maximum of ${maxPages} pages (${maxPages} images). Remove a page to add another.` },
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

  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
  if (!hasGemini && !hasReplicate) {
    return NextResponse.json(
      { error: "Conversion not configured. Set GEMINI_API_KEY or REPLICATE_API_TOKEN in .env.local." },
      { status: 503 }
    );
  }

  await getOrCreateUserProfile(userId);
  const deductResult = await deductCredit(userId);
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
    if (deductResult.ok) await refundCredit(userId, deductResult);
    return NextResponse.json(
      { error: "Could not get image URL" },
      { status: 400 }
    );
  }

  function sanitizeForClient(msg: string): string {
    if (msg.length > 200) return "";
    if (/token|key|secret|password|auth/i.test(msg)) return "";
    return msg;
  }

  let outlineImageUrl: string;
  try {
    outlineImageUrl = await runLineartWithFallback(signed.signedUrl);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("Conversion failed", errMsg, e);
    const isNoProvider = errMsg.includes("No conversion provider");
    const isReplicateAuth =
      errMsg.includes("401") ||
      errMsg.includes("Unauthorized") ||
      errMsg.includes("Unauthenticated") ||
      errMsg.includes("valid authentication token");
    const isReplicateRateLimit =
      errMsg.includes("429") || errMsg.includes("Too Many Requests");
    const isReplicatePaymentRequired =
      errMsg.includes("402") || errMsg.includes("Payment Required");
    const userMsg = isNoProvider
      ? "Conversion not configured. Set GEMINI_API_KEY or REPLICATE_API_TOKEN in .env.local."
      : isReplicateAuth
        ? "Replicate API token is invalid or expired. Get a new token at replicate.com and set REPLICATE_API_TOKEN in .env.local."
        : isReplicatePaymentRequired
          ? "Replicate account needs payment. Add a payment method or credits at replicate.com (Settings → Billing). Your credit has been refunded."
          : isReplicateRateLimit
            ? "Replicate rate limit reached. Wait a minute and try again."
            : (() => {
                const hint = errMsg.includes("not set") || errMsg.includes("REPLICATE") || errMsg.includes("GEMINI")
                  ? " Set GEMINI_API_KEY or REPLICATE_API_TOKEN in .env.local."
                  : "";
                const safe = sanitizeForClient(errMsg);
                return safe ? `Conversion failed: ${safe}.${hint}` : `Conversion failed. Please try again.${hint}`;
              })();
    if (deductResult.ok) await refundCredit(userId, deductResult);
    return NextResponse.json(
      { error: userMsg },
      { status: isNoProvider ? 503 : 502 }
    );
  }

  const outlinePath = `${userId}/${crypto.randomUUID()}.png`;
  const imageRes = await fetch(outlineImageUrl);
  if (!imageRes.ok) {
    console.error("Failed to fetch conversion output", outlineImageUrl, imageRes.status, imageRes.statusText);
    if (deductResult.ok) await refundCredit(userId, deductResult);
    return NextResponse.json(
      {
        error: `Conversion service returned an invalid image (${imageRes.status}). Please try again or use a different photo.`,
      },
      { status: 502 }
    );
  }
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const contentType = (() => {
    const raw = imageRes.headers.get("content-type");
    if (!raw) return "image/png";
    const base = raw.split(";")[0].trim().toLowerCase();
    if (base === "image/png" || base === "image/jpeg" || base === "image/webp") return base;
    return "image/png";
  })();
  const { error: uploadError } = await supabase.storage
    .from("outlines")
    .upload(outlinePath, imageBuffer, { contentType, upsert: false });

  if (uploadError) {
    console.error("Outline upload error", uploadError);
    if (deductResult.ok) await refundCredit(userId, deductResult);
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
      stylization: "none",
    })
    .select("id")
    .single();

  if (insertError || !savedConversion) {
    console.error("saved_conversions insert", {
      code: insertError?.code,
      message: insertError?.message,
      details: insertError?.details,
    });
    if (deductResult.ok) await refundCredit(userId, deductResult);
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
          saved_conversion_id: savedConversion.id,
          original_image_path: storage_path,
          outline_image_path: outlinePath,
          conversion_status: "completed",
          credit_value_cents: null,
        })
        .select("id")
        .single();
      if (!pageError && page) {
        pageId = page.id;
        await supabase
          .from("books")
          .update({
            page_count: position,
            credits_applied_value_cents: 0,
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
  });
}

