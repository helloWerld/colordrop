import { describe, expect, it } from "vitest";
import { convertBodySchema } from "@/lib/validators";

describe("convertBodySchema upload_consent", () => {
  it("accepts upload_consent true", () => {
    const parsed = convertBodySchema.safeParse({
      storage_path: "user/x.png",
      conversion_context: "one_off",
      upload_consent: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing upload_consent", () => {
    const parsed = convertBodySchema.safeParse({
      storage_path: "user/x.png",
      conversion_context: "one_off",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects upload_consent false", () => {
    const parsed = convertBodySchema.safeParse({
      storage_path: "user/x.png",
      conversion_context: "one_off",
      upload_consent: false,
    });
    expect(parsed.success).toBe(false);
  });
});
