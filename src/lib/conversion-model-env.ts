/**
 * Image conversion model IDs from environment.
 *
 * ---------------------------------------------------------------------------
 * OpenAI — env `OPENAI_IMAGE_CONVERSION_MODEL` (passed to `images.edit` as `model`)
 *
 * Documented options — confirm before changing defaults:
 * - https://platform.openai.com/docs/api-reference/images/createEdit
 * - https://platform.openai.com/docs/models
 *
 * Known `model` values for image edit / generation APIs (verify current support):
 * - gpt-image-1.5
 * - gpt-image-1
 * - gpt-image-1-mini
 * - chatgpt-image-latest
 * - dall-e-2
 * - dall-e-3
 * ---------------------------------------------------------------------------
 */
const OPENAI_IMAGE_CONVERSION_MODELS = new Set([
  "gpt-image-1.5",
  "gpt-image-1",
  "gpt-image-1-mini",
  "chatgpt-image-latest",
  "dall-e-2",
  "dall-e-3",
]);

const DEFAULT_OPENAI_IMAGE_CONVERSION_MODEL = "gpt-image-1.5";

export function getOpenAIImageConversionModel(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw = env.OPENAI_IMAGE_CONVERSION_MODEL?.trim();
  if (!raw) return DEFAULT_OPENAI_IMAGE_CONVERSION_MODEL;
  if (OPENAI_IMAGE_CONVERSION_MODELS.has(raw)) return raw;
  console.warn(
    `[openai-fallback] Unknown OPENAI_IMAGE_CONVERSION_MODEL ${JSON.stringify(raw)}; using ${DEFAULT_OPENAI_IMAGE_CONVERSION_MODEL}.`,
  );
  return DEFAULT_OPENAI_IMAGE_CONVERSION_MODEL;
}

/**
 * ---------------------------------------------------------------------------
 * Google Gemini — env `GEMINI_IMAGE_CONVERSION_MODEL`
 *
 * Used with `generateContent` and `responseModalities: ["IMAGE"]` for native
 * image output. Confirm IDs and capabilities at:
 * - https://ai.google.dev/gemini-api/docs/models
 *
 * Known image-capable model IDs for this flow (verify with a smoke test):
 * - gemini-2.5-flash-image
 * - gemini-2.0-flash-preview-image-generation
 * ---------------------------------------------------------------------------
 */
const GEMINI_IMAGE_CONVERSION_MODELS = new Set([
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
]);

const DEFAULT_GEMINI_IMAGE_CONVERSION_MODEL = "gemini-2.5-flash-image";

export function getGeminiImageConversionModel(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw = env.GEMINI_IMAGE_CONVERSION_MODEL?.trim();
  if (!raw) return DEFAULT_GEMINI_IMAGE_CONVERSION_MODEL;
  if (GEMINI_IMAGE_CONVERSION_MODELS.has(raw)) return raw;
  console.warn(
    `[gemini] Unknown GEMINI_IMAGE_CONVERSION_MODEL ${JSON.stringify(raw)}; using ${DEFAULT_GEMINI_IMAGE_CONVERSION_MODEL}.`,
  );
  return DEFAULT_GEMINI_IMAGE_CONVERSION_MODEL;
}
