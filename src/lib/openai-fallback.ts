/**
 * OpenAI image edit fallback used when Gemini fails.
 */

import OpenAI from "openai";

const LINEART_PROMPT =
  "Convert this exact image into a coloring book page. Keep the same composition and subject. Output outline-only: thin black lines on white or transparent background. No solid black fills, no large black areas, no shading, no color—only clear outlines suitable for coloring.";

export async function runLineartOpenAIFallback(
  sourceImageUrl: string,
): Promise<{
  imageUrl: string;
  providerCostCents: number | null;
  usageMetadata?: Record<string, unknown> | null;
}> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const openai = new OpenAI({ apiKey: key });
  const prompt = LINEART_PROMPT;

  const imageRes = await fetch(sourceImageUrl);
  if (!imageRes.ok) throw new Error("Failed to fetch image for OpenAI");
  const imageBuffer = await imageRes.arrayBuffer();
  const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt: prompt + " White or transparent background only.",
    n: 1,
    size: "1024x1024",
  });

  const data = response.data?.[0];
  if (!data) throw new Error("OpenAI returned no image");

  const outputImageUrl = data.url
    ? data.url
    : data.b64_json
      ? `data:image/png;base64,${data.b64_json}`
      : null;
  if (!outputImageUrl) throw new Error("OpenAI response missing url and b64_json");

  const usage =
    response && typeof response === "object" && "usage" in response
      ? (response.usage as unknown as Record<string, unknown>)
      : null;
  const costCents =
    usage && typeof usage.cost_cents === "number" ? usage.cost_cents : null;

  return {
    imageUrl: outputImageUrl,
    providerCostCents: costCents,
    usageMetadata: usage,
  };
}
