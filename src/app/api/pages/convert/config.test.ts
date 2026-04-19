import { describe, expect, it } from "vitest";
import { getConversionProviderConfig } from "@/lib/conversion-provider-config";

describe("getConversionProviderConfig", () => {
  it("fails in production when OPENAI_API_KEY is missing (auto mode)", () => {
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

  it("passes in production when OPENAI_API_KEY is set (auto)", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "production",
      OPENAI_API_KEY: "openai-key",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("auto");
  });

  it("passes in production with gemini mode and only GEMINI_API_KEY", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "production",
      IMAGE_CONVERSION_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-key",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mode).toBe("gemini");
  });

  it("fails in production with gemini mode when GEMINI_API_KEY is missing", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "production",
      IMAGE_CONVERSION_PROVIDER: "gemini",
      OPENAI_API_KEY: "openai-key",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("GEMINI_API_KEY is required");
    }
  });

  it("fails with invalid IMAGE_CONVERSION_PROVIDER", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "development",
      IMAGE_CONVERSION_PROVIDER: "banana",
      GEMINI_API_KEY: "g",
      OPENAI_API_KEY: "o",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid IMAGE_CONVERSION_PROVIDER");
    }
  });

  it("fails outside production when both providers are missing (auto)", () => {
    const result = getConversionProviderConfig({ NODE_ENV: "development" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Set GEMINI_API_KEY or OPENAI_API_KEY");
    }
  });

  it("fails in development with openai mode when OPENAI_API_KEY is missing", () => {
    const result = getConversionProviderConfig({
      NODE_ENV: "development",
      IMAGE_CONVERSION_PROVIDER: "openai",
      GEMINI_API_KEY: "gemini-key",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("OPENAI_API_KEY is required");
    }
  });
});
