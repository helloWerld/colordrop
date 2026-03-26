/**
 * Gemini Nano Banana (image editing) as primary conversion provider.
 * Converts photo to coloring book outline via gemini-2.5-flash-image.
 */

import { GoogleGenAI } from "@google/genai";

const LINEART_PROMPT =
  "Convert this exact image into a coloring book page. Keep the same composition and subject. Output outline-only: thin black lines on white or transparent background. No solid black fills, no large black areas, no shading, no color—only clear outlines suitable for coloring.";

const MODEL = "gemini-2.5-flash-image";

function getMimeFromContentType(header: string | null): string {
  if (!header) return "image/png";
  const base = header.split(";")[0].trim().toLowerCase();
  if (base === "image/png" || base === "image/jpeg" || base === "image/webp")
    return base;
  return "image/png";
}

export async function runLineartConversion(imageUrl: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok)
    throw new Error(`Failed to fetch image for Gemini: ${imageRes.status}`);
  const imageBuffer = await imageRes.arrayBuffer();
  const mimeType = getMimeFromContentType(
    imageRes.headers.get("content-type")
  );
  const base64Data = Buffer.from(imageBuffer).toString("base64");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: LINEART_PROMPT },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ],
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const candidates = response.candidates;
  if (!candidates?.length) throw new Error("Gemini returned no candidates");

  const parts = candidates[0].content?.parts;
  if (!parts?.length) throw new Error("Gemini returned no content parts");

  for (const part of parts) {
    const inlineData = (part as { inlineData?: { mimeType?: string; data?: string } }).inlineData;
    if (inlineData?.data) {
      const mime = inlineData.mimeType ?? "image/png";
      return `data:${mime};base64,${inlineData.data}`;
    }
  }

  throw new Error("Gemini response contained no image data");
}
