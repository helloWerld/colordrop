export function getConversionProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
) {
  const hasGemini = !!env.GEMINI_API_KEY;
  const hasOpenAI = !!env.OPENAI_API_KEY;
  const isProduction = env.NODE_ENV === "production";

  if (isProduction && !hasOpenAI) {
    return {
      ok: false as const,
      status: 503,
      error: "Conversion not configured. OPENAI_API_KEY is required in production.",
    };
  }

  if (!hasGemini && !hasOpenAI) {
    return {
      ok: false as const,
      status: 503,
      error:
        "Conversion not configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env.local.",
    };
  }

  return { ok: true as const };
}
