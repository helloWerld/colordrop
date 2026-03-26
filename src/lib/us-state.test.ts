import { describe, expect, it } from "vitest";
import { normalizeUsStateCodeForLulu } from "./us-state";

describe("normalizeUsStateCodeForLulu", () => {
  it("accepts valid 2-letter codes in any case", () => {
    expect(normalizeUsStateCodeForLulu("CA")).toBe("CA");
    expect(normalizeUsStateCodeForLulu("ca")).toBe("CA");
    expect(normalizeUsStateCodeForLulu(" Ny ")).toBe("NY");
  });

  it("maps full state names", () => {
    expect(normalizeUsStateCodeForLulu("California")).toBe("CA");
    expect(normalizeUsStateCodeForLulu("new york")).toBe("NY");
    expect(normalizeUsStateCodeForLulu("District of Columbia")).toBe("DC");
  });

  it("returns null for invalid input", () => {
    expect(normalizeUsStateCodeForLulu("")).toBeNull();
    expect(normalizeUsStateCodeForLulu("ZZ")).toBeNull();
    expect(normalizeUsStateCodeForLulu("Californa")).toBeNull();
    expect(normalizeUsStateCodeForLulu("USA")).toBeNull();
  });
});
