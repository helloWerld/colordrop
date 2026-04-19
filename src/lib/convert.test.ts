import sharp from "sharp";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const runGeminiConversionMock = vi.fn();
const runLineartOpenAIFallbackMock = vi.fn();

const { resizeLineartOutputToDataUrlMock } = vi.hoisted(() => ({
  resizeLineartOutputToDataUrlMock: vi.fn(
    async (url: string, w: number, h: number) => `normalized:${w}x${h}:${url}`,
  ),
}));

vi.mock("@/lib/gemini", () => ({
  runLineartConversionWithMetadata: runGeminiConversionMock,
}));

vi.mock("@/lib/openai-fallback", () => ({
  runLineartOpenAIFallback: runLineartOpenAIFallbackMock,
}));

vi.mock("@/lib/resize-conversion-output", () => ({
  resizeLineartOutputToDataUrl: resizeLineartOutputToDataUrlMock,
}));

describe("runLineartWithFallback", () => {
  let inputPng800x1000: Buffer;

  beforeAll(async () => {
    inputPng800x1000 = await sharp({
      create: {
        width: 800,
        height: 1000,
        channels: 3,
        background: { r: 40, g: 40, b: 40 },
      },
    })
      .png()
      .toBuffer();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.IMAGE_CONVERSION_PROVIDER;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("input.png")) {
          return Promise.resolve(
            new Response(inputPng800x1000, {
              status: 200,
              headers: { "content-type": "image/png" },
            }),
          );
        }
        return Promise.reject(new Error(`unexpected fetch: ${url}`));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses gemini when available and successful (auto)", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.OPENAI_API_KEY = "openai-key";
    runGeminiConversionMock.mockResolvedValue({
      imageUrl: "https://example.com/gemini.png",
      provider: "gemini",
      providerCostCents: 7,
      usageMetadata: { source: "gemini" },
    });

    const { runLineartWithFallback } = await import("@/lib/convert");
    const result = await runLineartWithFallback("https://example.com/input.png");

    expect(result.provider).toBe("gemini");
    expect(result.imageUrl).toBe(
      "normalized:800x1000:https://example.com/gemini.png",
    );
    expect(runGeminiConversionMock).toHaveBeenCalledWith(
      "https://example.com/input.png",
      { width: 800, height: 1000 },
    );
    expect(resizeLineartOutputToDataUrlMock).toHaveBeenCalledWith(
      "https://example.com/gemini.png",
      800,
      1000,
    );
    expect(runLineartOpenAIFallbackMock).not.toHaveBeenCalled();
  });

  it("falls back to openai when gemini fails (auto)", async () => {
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
    expect(result.imageUrl).toBe(
      "normalized:800x1000:https://example.com/openai.png",
    );
    expect(runLineartOpenAIFallbackMock).toHaveBeenCalledWith(
      "https://example.com/input.png",
      { width: 800, height: 1000 },
    );
    expect(runLineartOpenAIFallbackMock).toHaveBeenCalledTimes(1);
  });

  it("throws when no provider is configured (auto)", async () => {
    const { runLineartWithFallback } = await import("@/lib/convert");
    await expect(
      runLineartWithFallback("https://example.com/input.png"),
    ).rejects.toThrow("Set GEMINI_API_KEY or OPENAI_API_KEY");
  });

  it("uses openai only when IMAGE_CONVERSION_PROVIDER=openai", async () => {
    process.env.IMAGE_CONVERSION_PROVIDER = "openai";
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.OPENAI_API_KEY = "openai-key";
    runLineartOpenAIFallbackMock.mockResolvedValue({
      imageUrl: "https://example.com/openai.png",
      providerCostCents: null,
      usageMetadata: null,
    });

    const { runLineartWithFallback } = await import("@/lib/convert");
    const result = await runLineartWithFallback("https://example.com/input.png");

    expect(result.provider).toBe("openai");
    expect(runGeminiConversionMock).not.toHaveBeenCalled();
    expect(runLineartOpenAIFallbackMock).toHaveBeenCalledTimes(1);
  });

  it("does not fall back to openai when IMAGE_CONVERSION_PROVIDER=gemini and gemini fails", async () => {
    process.env.IMAGE_CONVERSION_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.OPENAI_API_KEY = "openai-key";
    runGeminiConversionMock.mockRejectedValue(new Error("gemini failed"));

    const { runLineartWithFallback } = await import("@/lib/convert");
    await expect(
      runLineartWithFallback("https://example.com/input.png"),
    ).rejects.toThrow("gemini failed");
    expect(runLineartOpenAIFallbackMock).not.toHaveBeenCalled();
  });

  it("accepts case-insensitive IMAGE_CONVERSION_PROVIDER", async () => {
    process.env.IMAGE_CONVERSION_PROVIDER = " OpenAI ";
    process.env.OPENAI_API_KEY = "openai-key";
    runLineartOpenAIFallbackMock.mockResolvedValue({
      imageUrl: "https://example.com/openai.png",
      providerCostCents: null,
      usageMetadata: null,
    });

    const { runLineartWithFallback } = await import("@/lib/convert");
    await runLineartWithFallback("https://example.com/input.png");
    expect(runGeminiConversionMock).not.toHaveBeenCalled();
  });
});
