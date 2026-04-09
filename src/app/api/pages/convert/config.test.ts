import { describe, expect, it } from "vitest";
import { getConversionProviderConfig } from "@/lib/conversion-provider-config";

describe("getConversionProviderConfig", () => {
  it("fails in production when OPENAI_API_KEY is missing", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "production",
      GEMINI_API_KEY: "gemini-only",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(503);
      expect(result.error).toContain("OPENAI_API_KEY is required in production");
    }
  });

  it("passes in production when OPENAI_API_KEY is set", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "production",
      OPENAI_API_KEY: "openai-key",
    });

    expect(result.ok).toBe(true);
  });

  it("fails outside production when both providers are missing", () => {
    const result = getConversionProviderConfig({ NODE_ENV: "development" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Set GEMINI_API_KEY or OPENAI_API_KEY");
    }
  });
});
