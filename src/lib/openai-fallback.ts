/**
 * OpenAI image edit fallback when Replicate fails.
 * PRD §7.5: Optional second fallback; reserved for future use.
 *
 * Currently not used (conversion uses Gemini primary, Replicate fallback).
 * Kept for future use: call from orchestrator after Replicate fails if desired.
 */

import OpenAI from "openai";

const LINEART_PROMPT =
  "Convert this exact image into a coloring book page. Keep the same composition and subject. Output outline-only: thin black lines on white or transparent background. No solid black fills, no large black areas, no shading, no color—only clear outlines suitable for coloring.";

export async function runLineartOpenAIFallback(imageUrl: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const openai = new OpenAI({ apiKey: key });
  const prompt = LINEART_PROMPT;

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("Failed to fetch image for OpenAI");
  const imageBuffer = await imageRes.arrayBuffer();
  const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt:
      prompt +
      " White or transparent background only.",
    n: 1,
    size: "1024x1024",
  });

  const data = response.data?.[0];
  if (!data) throw new Error("OpenAI returned no image");

  if (data.url) return data.url;
  if (data.b64_json) {
    return `data:image/png;base64,${data.b64_json}`;
  }
  throw new Error("OpenAI response missing url and b64_json");
}
