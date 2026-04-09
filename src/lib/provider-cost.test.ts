import { describe, expect, it } from "vitest";
import { parseGeminiCostCents } from "@/lib/gemini";

describe("parseGeminiCostCents", () => {
  it("returns null when usage metadata is absent", () => {
    expect(parseGeminiCostCents({})).toBeNull();
  });

  it("parses direct cents field", () => {
    expect(
      parseGeminiCostCents({
        usageMetadata: { totalCostCents: 42 },
      }),
    ).toBe(42);
  });

  it("parses micros into cents", () => {
    expect(
      parseGeminiCostCents({
        usageMetadata: { totalCostMicros: 123_456 },
      }),
    ).toBe(12);
  });
});

