/**
 * OpenAI image edit fallback when Replicate fails.
 * PRD §4.7: "Convert this photo to a clean black-and-white coloring book page..."
 */

import OpenAI from "openai";
import type { Stylization } from "./validators";
import { STYLIZATION_PROMPTS } from "./stylization-prompts";

export async function runLineartOpenAIFallback(
  imageUrl: string,
  stylization: Stylization
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const openai = new OpenAI({ apiKey: key });
  const prompt = STYLIZATION_PROMPTS[stylization];

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("Failed to fetch image for OpenAI");
  const imageBuffer = await imageRes.arrayBuffer();
  const imageFile = new File([imageBuffer], "image.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt:
      prompt +
      " Output only a black-and-white outline image, no color, no shading, white background.",
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
