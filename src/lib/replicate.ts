import Replicate from "replicate";

// Pin to a specific version to avoid 404s from Replicate's API (owner/name can resolve incorrectly).
const LINEART_MODEL =
  "pnyompen/sd-lineart-controlnet:cbb04d27d4ecf4817168a85a4cf9670669db0ea543e78022e5c34109e291218c";

// Try-for-free image editing model (limited free runs, no card required). Use REPLICATE_USE_FREE_MODEL=true to test.
const FLUX_KONTEXT_MODEL = "black-forest-labs/flux-kontext-pro";

function extractImageUrl(output: unknown): string {
  const list = Array.isArray(output) ? output : output != null ? [output] : [];
  if (list.length === 0) throw new Error("Replicate returned no image");
  const first = list[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    const withUrl = first as { url?: string | (() => string | URL) };
    if (typeof withUrl.url === "string") return withUrl.url;
    if (typeof withUrl.url === "function") return String(withUrl.url());
  }
  throw new Error("Invalid Replicate output");
}

export async function runLineartConversion(imageUrl: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");

  const useFreeModel = process.env.REPLICATE_USE_FREE_MODEL === "true";
  const replicate = new Replicate({ auth: token, useFileOutput: false });

  if (useFreeModel) {
    // FLUX Kontext Pro: image + prompt → edited image. In Replicate's "Try for Free" collection (limited free runs).
    const output = await replicate.run(FLUX_KONTEXT_MODEL, {
      input: {
        prompt: `Convert this exact image into a coloring book page. Keep the same composition and subject. Output outline-only: thin black lines on white or transparent background. No solid black fills, no large black areas, no shading, no color—only clear outlines suitable for coloring.`,
        image: imageUrl,
      },
    });
    return extractImageUrl(output);
  }

  const output = await replicate.run(LINEART_MODEL, {
    input: {
      image: imageUrl,
      prompt: `Convert this exact image into a coloring book page. Keep the same composition and subject. Output outline-only: thin black lines on white or transparent background. No solid black fills, no large black areas, no shading, no color—only clear outlines suitable for coloring.`,
      strength: 0.75,
      num_outputs: 1,
    },
  });
  return extractImageUrl(output);
}

function getRetryAfterSeconds(e: unknown): number | null {
  const err = e as { response?: { headers?: Headers } };
  const header = err?.response?.headers?.get?.("retry-after");
  if (header == null) return null;
  const n = parseInt(header, 10);
  if (Number.isFinite(n) && n >= 0 && n <= 120) return n;
  return null;
}

function isRateLimitError(e: unknown): boolean {
  const err = e as { response?: { status?: number }; message?: string };
  const status = err?.response?.status;
  const msg = err?.message ?? "";
  return (
    status === 429 || msg.includes("429") || msg.includes("Too Many Requests")
  );
}

export async function runLineartWithRetry(
  imageUrl: string,
  maxRetries = 3,
): Promise<string> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await runLineartConversion(imageUrl);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (isRateLimitError(e) && i < maxRetries - 1) {
        const waitSec = getRetryAfterSeconds(e) ?? 10;
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      }
    }
  }
  throw lastError ?? new Error("Conversion failed");
}
