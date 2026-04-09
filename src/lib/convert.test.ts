import { beforeEach, describe, expect, it, vi } from "vitest";

const runGeminiConversionMock = vi.fn();
const runLineartOpenAIFallbackMock = vi.fn();

vi.mock("@/lib/gemini", () => ({
  runLineartConversionWithMetadata: runGeminiConversionMock,
}));

vi.mock("@/lib/openai-fallback", () => ({
  runLineartOpenAIFallback: runLineartOpenAIFallbackMock,
}));

describe("runLineartWithFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it("uses gemini when available and successful", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.OPENAI_API_KEY = "openai-key";
    runGeminiConversionMock.mockResolvedValue({
      imageUrl: "https://example.com/gemini.png",
      providerCostCents: 7,
      usageMetadata: { source: "gemini" },
    });

    const { runLineartWithFallback } = await import("@/lib/convert");
    const result = await runLineartWithFallback("https://example.com/input.png");

    expect(result.provider).toBe("gemini");
    expect(result.imageUrl).toBe("https://example.com/gemini.png");
    expect(runLineartOpenAIFallbackMock).not.toHaveBeenCalled();
  });

  it("falls back to openai when gemini fails", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.OPENAI_API_KEY = "openai-key";
    runGeminiConversionMock.mockRejectedValue(new Error("gemini failed"));
    runLineartOpenAIFallbackMock.mockResolvedValue({
      imageUrl: "https://example.com/openai.png",
      providerCostCents: null,
      usageMetadata: null,
    });

    const { runLineartWithFallback } = await import("@/lib/convert");
    const result = await runLineartWithFallback("https://example.com/input.png");

    expect(result.provider).toBe("openai");
    expect(result.imageUrl).toBe("https://example.com/openai.png");
    expect(runLineartOpenAIFallbackMock).toHaveBeenCalledTimes(1);
  });

  it("throws when no provider is configured", async () => {
    const { runLineartWithFallback } = await import("@/lib/convert");
    await expect(
      runLineartWithFallback("https://example.com/input.png"),
    ).rejects.toThrow("Set GEMINI_API_KEY or OPENAI_API_KEY");
  });
});
