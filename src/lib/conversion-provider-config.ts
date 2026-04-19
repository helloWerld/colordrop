export type ImageConversionProviderMode = "auto" | "gemini" | "openai";

export function parseImageConversionProviderMode(
  env: NodeJS.ProcessEnv,
):
  | { ok: true; mode: ImageConversionProviderMode }
  | { ok: false; error: string } {
  const raw = env.IMAGE_CONVERSION_PROVIDER;
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!v || v === "auto") return { ok: true, mode: "auto" };
  if (v === "gemini") return { ok: true, mode: "gemini" };
  if (v === "openai") return { ok: true, mode: "openai" };
  return {
    ok: false,
    error:
      `Invalid IMAGE_CONVERSION_PROVIDER. Use auto, gemini, or openai (got ${JSON.stringify(typeof raw === "string" ? raw.trim() : raw)}).`,
  };
}

export function getConversionProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
) {
  const parsed = parseImageConversionProviderMode(env);
  if (!parsed.ok) {
    return {
      ok: false as const,
      status: 503,
      error: parsed.error,
    };
  }

  const mode = parsed.mode;
  const hasGemini = !!env.GEMINI_API_KEY;
  const hasOpenAI = !!env.OPENAI_API_KEY;
  const isProduction = env.NODE_ENV === "production";

  if (mode === "auto") {
    if (isProduction && !hasOpenAI) {
      return {
        ok: false as const,
        status: 503,
        error:
          "Conversion not configured. OPENAI_API_KEY is required in production when IMAGE_CONVERSION_PROVIDER is auto (default) for OpenAI fallback.",
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
    return { ok: true as const, mode };
  }

  if (mode === "gemini") {
    if (!hasGemini) {
      return {
        ok: false as const,
        status: 503,
        error:
          "Conversion not configured. GEMINI_API_KEY is required when IMAGE_CONVERSION_PROVIDER=gemini.",
      };
    }
    return { ok: true as const, mode };
  }

  // openai
  if (!hasOpenAI) {
    return {
      ok: false as const,
      status: 503,
      error:
        "Conversion not configured. OPENAI_API_KEY is required when IMAGE_CONVERSION_PROVIDER=openai.",
    };
  }
  return { ok: true as const, mode };
}
