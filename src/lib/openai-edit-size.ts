/**
 * OpenAI `images.edit` only accepts discrete `size` values. We map the **original
 * image aspect ratio** (from width × height) to the closest allowed preset, then
 * the pipeline resizes the model output to the exact source dimensions (contain
 * on white in `resize-conversion-output.ts`).
 *
 * Confirm allowed `size` strings at:
 * https://platform.openai.com/docs/api-reference/images/createEdit
 */
export const OPENAI_IMAGE_EDIT_SIZE_PRESETS = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
] as const;

export type OpenAIImageEditSizePreset =
  (typeof OPENAI_IMAGE_EDIT_SIZE_PRESETS)[number];

const PRESET_ASPECT = OPENAI_IMAGE_EDIT_SIZE_PRESETS.map((size) => {
  const [w, h] = size.split("x").map(Number);
  return { size, aspect: w / h };
});

/**
 * Pick the API `size` preset whose aspect ratio is closest to the source image
 * (log-space distance), so OpenAI generates on a canvas similar to the upload.
 */
export function resolveOpenAIImageEditSize(
  sourceWidth: number,
  sourceHeight: number,
): OpenAIImageEditSizePreset {
  const targetAspect = sourceWidth / sourceHeight;
  let best = PRESET_ASPECT[0]!;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const row of PRESET_ASPECT) {
    const score = Math.abs(Math.log(targetAspect) - Math.log(row.aspect));
    if (score < bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best.size;
}
