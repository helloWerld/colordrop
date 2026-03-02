import Replicate from "replicate";
import type { Stylization } from "./validators";
import { STYLIZATION_PROMPTS } from "./stylization-prompts";

const MODEL = "pnyompen/sd-lineart-controlnet";

export async function runLineartConversion(
  imageUrl: string,
  stylization: Stylization
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set");

  const replicate = new Replicate({ auth: token });
  const prompt = STYLIZATION_PROMPTS[stylization];

  const output = await replicate.run(MODEL as `${string}/${string}`, {
    input: {
      image: imageUrl,
      prompt,
      strength: 0.75,
      num_outputs: 1,
    },
  });

  if (!output || !Array.isArray(output) || output.length === 0) {
    throw new Error("Replicate returned no image");
  }
  const url = output[0];
  if (typeof url !== "string") throw new Error("Invalid Replicate output");
  return url;
}

export async function runLineartWithRetry(
  imageUrl: string,
  stylization: Stylization,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await runLineartConversion(imageUrl, stylization);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error("Conversion failed");
}
