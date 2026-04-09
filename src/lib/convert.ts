/**
 * Conversion orchestrator: Gemini primary, OpenAI fallback.
 */

import { runLineartConversionWithMetadata as runGeminiConversion } from "@/lib/gemini";
import { runLineartOpenAIFallback } from "@/lib/openai-fallback";

export type ConversionProvider = "gemini" | "openai";

export type LineartConversionResult = {
  imageUrl: string;
  provider: ConversionProvider;
  providerCostCents: number | null;
  usageMetadata?: Record<string, unknown> | null;
};

export async function runLineartWithFallback(
  imageUrl: string,
): Promise<LineartConversionResult> {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (hasGemini) {
    try {
      const result = await runGeminiConversion(imageUrl);
      return { ...result, provider: "gemini" };
    } catch (e) {
      console.warn(
        "[convert] Gemini conversion failed, falling back to OpenAI:",
        e instanceof Error ? e.message : String(e)
      );
    }
  } else if (hasOpenAI) {
    console.info("[convert] GEMINI_API_KEY not set, using OpenAI only.");
  }

  if (hasOpenAI) {
    const result = await runLineartOpenAIFallback(imageUrl);
    return { ...result, provider: "openai" };
  }

  throw new Error(
    "No conversion provider available. Set GEMINI_API_KEY or OPENAI_API_KEY."
  );
}
