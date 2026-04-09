import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getOrCreateUserProfile } from "@/lib/db";
import { deductCredit, refundCredit, type DeductResult } from "@/lib/credits";
import { runLineartWithFallback } from "@/lib/convert";
import { checkConversionLimit } from "@/lib/rate-limit";
import { logIntegrationEvent } from "@/lib/integration-events";
import { convertBodySchema } from "@/lib/validators";
import {
  BOOK_LOCKED_FOR_EDITING_ERROR,
  isBookLockedForEditing,
} from "@/lib/print-snapshot";
import { getConversionProviderConfig } from "@/lib/conversion-provider-config";

async function rollbackSavedConversionAfterBookPageFailure(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  args: {
    userId: string;
    deductResult: DeductResult;
    savedConversionId: string;
    outlinePath: string;
  },
): Promise<void> {
  const { userId, deductResult, savedConversionId, outlinePath } = args;
  if (deductResult.ok) await refundCredit(userId, deductResult);
  await supabase.from("saved_conversions").delete().eq("id", savedConversionId);
  await supabase.storage.from("outlines").remove([outlinePath]);
}

export async function POST(request: Request) {
  try {
    return await handleConvert(request);
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[pages/convert] Unhandled error", errMsg, e);
    const safe =
      errMsg.length <= 200 && !/token|key|secret|password|auth/i.test(errMsg)
        ? errMsg
        : "";
    return NextResponse.json(
      {
        error: safe
          ? `Conversion failed: ${safe}`
          : "Conversion failed. Please try again.",
      },
      { status: 502 },
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
      { status: 400 },
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
    if (bookRow && (await isBookLockedForEditing(supabase, book_id))) {
      return NextResponse.json(
        { error: BOOK_LOCKED_FOR_EDITING_ERROR },
        { status: 409 },
      );
    }
    const maxPages = bookRow?.page_tier ?? 128;
    if (bookRow && (bookRow.page_count ?? 0) >= maxPages) {
      return NextResponse.json(
        {
          error: `This book has a maximum of ${maxPages} pages (${maxPages} images). Remove a page to add another.`,
        },
        { status: 400 },
      );
    }
  }

  const convLimit = checkConversionLimit(userId);
  if (!convLimit.ok) {
    return NextResponse.json(
      { error: "Too many conversions this hour. Please try again later." },
      {
        status: 429,
        headers: convLimit.retryAfter
          ? { "Retry-After": String(convLimit.retryAfter) }
          : {},
      },
    );
  }

  const providerConfig = getConversionProviderConfig();
  if (!providerConfig.ok) {
    return NextResponse.json(
      { error: providerConfig.error },
      { status: providerConfig.status },
    );
  }

  await getOrCreateUserProfile(userId);
  const deductResult = await deductCredit(userId);
  if (!deductResult.ok) {
    return NextResponse.json(
      {
        code: "INSUFFICIENT_CREDITS",
        message: "No conversion credits left. Buy more credits.",
      },
      { status: 402 },
    );
  }

  const { data: signed } = await supabase.storage
    .from("originals")
    .createSignedUrl(storage_path, 3600);
  if (!signed?.signedUrl) {
    if (deductResult.ok) await refundCredit(userId, deductResult);
    return NextResponse.json(
      { error: "Could not get image URL" },
      { status: 400 },
    );
  }

  function sanitizeForClient(msg: string): string {
    if (msg.length > 200) return "";
    if (/token|key|secret|password|auth/i.test(msg)) return "";
    return msg;
  }

  let outlineImageUrl: string;
  let provider: "gemini" | "openai" | null = null;
  let providerCostCents: number | null = null;
  try {
    const conversion = await runLineartWithFallback(signed.signedUrl);
    outlineImageUrl = conversion.imageUrl;
    provider = conversion.provider;
    providerCostCents = conversion.providerCostCents;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("Conversion failed", errMsg, e);
    const isNoProvider = errMsg.includes("No conversion provider");
    const isOpenAIAuth =
      errMsg.includes("401") ||
      errMsg.includes("Unauthorized") ||
      errMsg.includes("Unauthenticated") ||
      errMsg.includes("valid authentication token");
    const userMsg = isNoProvider
      ? "Conversion not configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env.local."
      : isOpenAIAuth
        ? "OpenAI API key is invalid or expired. Set OPENAI_API_KEY in .env.local."
            : (() => {
                const hint =
                  errMsg.includes("not set") ||
                  errMsg.includes("OPENAI") ||
                  errMsg.includes("GEMINI")
                    ? " Set GEMINI_API_KEY or OPENAI_API_KEY in .env.local."
                    : "";
                const safe = sanitizeForClient(errMsg);
                return safe
                  ? `Conversion failed: ${safe}.${hint}`
                  : `Conversion failed. Please try again.${hint}`;
              })();
    await logIntegrationEvent(
      {
        provider: "conversion",
        eventType: "conversion.failed",
        severity: "error",
        status: "failed",
        bookId: book_id ?? null,
        errorMessage: errMsg,
        payload: { conversion_context, userId, storage_path },
      },
      supabase,
    );
    if (deductResult.ok) await refundCredit(userId, deductResult);
    return NextResponse.json(
      { error: userMsg },
      { status: isNoProvider ? 503 : 502 },
    );
  }

  const outlinePath = `${userId}/${crypto.randomUUID()}.png`;
  const imageRes = await fetch(outlineImageUrl);
  if (!imageRes.ok) {
    console.error(
      "Failed to fetch conversion output",
      outlineImageUrl,
      imageRes.status,
      imageRes.statusText,
    );
    if (deductResult.ok) await refundCredit(userId, deductResult);
    return NextResponse.json(
      {
        error: `Conversion service returned an invalid image (${imageRes.status}). Please try again or use a different photo.`,
      },
      { status: 502 },
    );
  }
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const contentType = (() => {
    const raw = imageRes.headers.get("content-type");
    if (!raw) return "image/png";
    const base = raw.split(";")[0].trim().toLowerCase();
    if (base === "image/png" || base === "image/jpeg" || base === "image/webp")
      return base;
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
      { status: 500 },
    );
  }

  const { data: savedConversion, error: insertError } = await supabase
    .from("saved_conversions")
    .insert({
      user_id: userId,
      original_image_path: storage_path,
      outline_image_path: outlinePath,
      conversion_context,
      provider,
      provider_cost_cents: providerCostCents,
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
      { status: 500 },
    );
  }

  await logIntegrationEvent(
    {
      provider: "conversion",
      eventType: "conversion.completed",
      severity: "info",
      status: "completed",
      bookId: book_id ?? null,
      payload: {
        conversion_context,
        saved_conversion_id: savedConversion.id,
        provider,
        provider_cost_cents: providerCostCents,
        provider_cost_captured: typeof providerCostCents === "number",
      },
    },
    supabase,
  );

  let pageId: string | null = null;
  if (conversion_context === "book" && book_id) {
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("id", book_id)
      .eq("user_id", userId)
      .single();
    if (!book) {
      console.error("book not found for book conversion", { book_id, userId });
      await logIntegrationEvent(
        {
          provider: "conversion",
          eventType: "conversion.book_page_failed",
          severity: "error",
          status: "failed",
          bookId: book_id,
          errorMessage: "Book not found or access denied after saved_conversions insert",
          payload: { saved_conversion_id: savedConversion.id },
        },
        supabase,
      );
      await rollbackSavedConversionAfterBookPageFailure(supabase, {
        userId,
        deductResult,
        savedConversionId: savedConversion.id,
        outlinePath,
      });
      return NextResponse.json(
        { error: "Could not add this page to your book. Your conversion credit was refunded." },
        { status: 404 },
      );
    }

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

    if (pageError || !page) {
      console.error("pages insert after conversion", {
        code: pageError?.code,
        message: pageError?.message,
        details: pageError?.details,
      });
      await logIntegrationEvent(
        {
          provider: "conversion",
          eventType: "conversion.book_page_failed",
          severity: "error",
          status: "failed",
          bookId: book_id,
          errorMessage: pageError?.message ?? "pages insert failed",
          payload: {
            saved_conversion_id: savedConversion.id,
            details: pageError?.details,
          },
        },
        supabase,
      );
      await rollbackSavedConversionAfterBookPageFailure(supabase, {
        userId,
        deductResult,
        savedConversionId: savedConversion.id,
        outlinePath,
      });
      return NextResponse.json(
        {
          error:
            "Failed to add this page to your book. Your conversion credit was refunded. Please try again.",
        },
        { status: 500 },
      );
    }

    pageId = page.id;
    await supabase
      .from("books")
      .update({
        page_count: position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", book_id);
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
