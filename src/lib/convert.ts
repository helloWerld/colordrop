/**
 * Conversion orchestrator: Nano Banana (Gemini) primary, Replicate fallback only.
 */

import { runLineartConversion as runGeminiConversion } from "@/lib/gemini";
import { runLineartWithRetry } from "@/lib/replicate";

export async function runLineartWithFallback(imageUrl: string): Promise<string> {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN;

  if (hasGemini) {
    try {
      const result = await runGeminiConversion(imageUrl);
      return result;
    } catch (e) {
      console.warn(
        "[convert] Gemini conversion failed, falling back to Replicate:",
        e instanceof Error ? e.message : String(e)
      );
    }
  } else if (hasReplicate) {
    console.info("[convert] GEMINI_API_KEY not set, using Replicate only.");
  }

  if (hasReplicate) {
    return await runLineartWithRetry(imageUrl);
  }

  throw new Error(
    "No conversion provider available. Set GEMINI_API_KEY or REPLICATE_API_TOKEN."
  );
}
