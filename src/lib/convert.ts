/**
 * Conversion orchestrator: IMAGE_CONVERSION_PROVIDER selects auto (Gemini
 * primary + OpenAI fallback), gemini-only, or openai-only.
 */

import imageSize from "image-size";
import { parseImageConversionProviderMode } from "@/lib/conversion-provider-config";
import { runLineartConversionWithMetadata as runGeminiConversion } from "@/lib/gemini";
import { runLineartOpenAIFallback } from "@/lib/openai-fallback";
import { resizeLineartOutputToDataUrl } from "@/lib/resize-conversion-output";

export type ConversionProvider = "gemini" | "openai";

export type LineartConversionResult = {
  imageUrl: string;
  provider: ConversionProvider;
  providerCostCents: number | null;
  usageMetadata?: Record<string, unknown> | null;
};

async function readSourceDimensions(
  imageUrl: string,
): Promise<{ width: number; height: number }> {
  const originalRes = await fetch(imageUrl);
  if (!originalRes.ok) {
    throw new Error(`Failed to fetch source image: ${originalRes.status}`);
  }
  const originalBuffer = Buffer.from(await originalRes.arrayBuffer());
  const dims = imageSize(originalBuffer);
  if (!dims.width || !dims.height) {
    throw new Error("Could not read source image dimensions.");
  }
  return { width: dims.width, height: dims.height };
}

async function withNormalizedDimensions(
  result: Pick<
    LineartConversionResult,
    "imageUrl" | "providerCostCents" | "usageMetadata"
  >,
  provider: ConversionProvider,
  width: number,
  height: number,
): Promise<LineartConversionResult> {
  const imageUrl = await resizeLineartOutputToDataUrl(
    result.imageUrl,
    width,
    height,
  );
  return {
    imageUrl,
    provider,
    providerCostCents: result.providerCostCents,
    usageMetadata: result.usageMetadata,
  };
}

export async function runLineartWithFallback(
  imageUrl: string,
): Promise<LineartConversionResult> {
  const parsed = parseImageConversionProviderMode(process.env);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  const mode = parsed.mode;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  const { width, height } = await readSourceDimensions(imageUrl);
  const dimensions = { width, height };

  if (mode === "openai") {
    console.info(
      "[convert] IMAGE_CONVERSION_PROVIDER=openai, using OpenAI only.",
    );
    if (!hasOpenAI) {
      throw new Error(
        "No conversion provider available. Set GEMINI_API_KEY or OPENAI_API_KEY.",
      );
    }
    const result = await runLineartOpenAIFallback(imageUrl, dimensions);
    return withNormalizedDimensions(result, "openai", width, height);
  }

  if (mode === "gemini") {
    console.info(
      "[convert] IMAGE_CONVERSION_PROVIDER=gemini, using Gemini only.",
    );
    if (!hasGemini) {
      throw new Error(
        "No conversion provider available. Set GEMINI_API_KEY or OPENAI_API_KEY.",
      );
    }
    const result = await runGeminiConversion(imageUrl, dimensions);
    return withNormalizedDimensions(result, "gemini", width, height);
  }

  if (hasGemini) {
    try {
      const result = await runGeminiConversion(imageUrl, dimensions);
      return withNormalizedDimensions(result, "gemini", width, height);
    } catch (e) {
      console.warn(
        "[convert] Gemini conversion failed, falling back to OpenAI:",
        e instanceof Error ? e.message : String(e),
      );
    }
  } else if (hasOpenAI) {
    console.info("[convert] GEMINI_API_KEY not set, using OpenAI only.");
  }

  if (hasOpenAI) {
    const result = await runLineartOpenAIFallback(imageUrl, dimensions);
    return withNormalizedDimensions(result, "openai", width, height);
  }

  throw new Error(
    "No conversion provider available. Set GEMINI_API_KEY or OPENAI_API_KEY.",
  );
}
