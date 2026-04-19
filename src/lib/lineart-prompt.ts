/**
 * Shared line-art instructions for Gemini and OpenAI conversion.
 */

export const LINEART_PROMPT_BASE =
  "Convert this exact image into a coloring book page. Keep the same composition and subject. Preserve relative positions and proportions of all major subjects; do not invent new objects; do not simplify away small figures or text unless illegible. Output outline-only: thin black lines on white or transparent background. No solid black fills, no large black areas, no shading, no color—only clear outlines suitable for coloring.";

export function lineartPromptWithDimensions(width: number, height: number): string {
  return `${LINEART_PROMPT_BASE} The source image is ${width}×${height} pixels; preserve framing and aspect ratio to match this canvas.`;
}
