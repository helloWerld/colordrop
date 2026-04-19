/**
 * OpenAI image edit fallback used when Gemini fails.
 *
 * Model env: see `getOpenAIImageConversionModel` in `@/lib/conversion-model-env`
 * (block comment lists all supported `images.edit` model IDs and doc links).
 */

import OpenAI from "openai";
import { getOpenAIImageConversionModel } from "@/lib/conversion-model-env";
import { lineartPromptWithDimensions } from "@/lib/lineart-prompt";
import { resolveOpenAIImageEditSize } from "@/lib/openai-edit-size";

function getMimeFromContentType(header: string | null): string {
  if (!header) return "image/png";
  const base = header.split(";")[0].trim().toLowerCase();
  if (base === "image/png" || base === "image/jpeg" || base === "image/webp")
    return base;
  return "image/png";
}

function mimeToFilename(mime: string): string {
  if (mime === "image/jpeg") return "image.jpg";
  if (mime === "image/webp") return "image.webp";
  return "image.png";
}

export type LineartSourceDimensions = {
  width: number;
  height: number;
};

export async function runLineartOpenAIFallback(
  sourceImageUrl: string,
  dimensions: LineartSourceDimensions,
): Promise<{
  imageUrl: string;
  providerCostCents: number | null;
  usageMetadata?: Record<string, unknown> | null;
}> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const openai = new OpenAI({ apiKey: key });
  const model = getOpenAIImageConversionModel();
  const prompt =
    lineartPromptWithDimensions(dimensions.width, dimensions.height) +
    " White or transparent background only.";

  const imageRes = await fetch(sourceImageUrl);
  if (!imageRes.ok) throw new Error("Failed to fetch image for OpenAI");
  const imageBuffer = await imageRes.arrayBuffer();
  const mimeType = getMimeFromContentType(imageRes.headers.get("content-type"));
  const imageFile = new File([imageBuffer], mimeToFilename(mimeType), {
    type: mimeType,
  });

  const size = resolveOpenAIImageEditSize(
    dimensions.width,
    dimensions.height,
  );

  const response = await openai.images.edit({
    model,
    image: imageFile,
    prompt,
    n: 1,
    size,
  });

  const data = response.data?.[0];
  if (!data) throw new Error("OpenAI returned no image");

  const outputImageUrl = data.url
    ? data.url
    : data.b64_json
      ? `data:image/png;base64,${data.b64_json}`
      : null;
  if (!outputImageUrl)
    throw new Error("OpenAI response missing url and b64_json");

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
