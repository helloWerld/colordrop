import { beforeEach, describe, expect, it, vi } from "vitest";

describe("rate-limit in-memory", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows up to 10 uploads per minute per user", async () => {
    const { checkUploadLimit } = await import("./rate-limit");
    for (let i = 0; i < 10; i++) {
      expect(checkUploadLimit("user-a").ok).toBe(true);
    }
    const blocked = checkUploadLimit("user-a");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks upload limits per user independently", async () => {
    const { checkUploadLimit } = await import("./rate-limit");
    for (let i = 0; i < 10; i++) {
      checkUploadLimit("user-a");
    }
    expect(checkUploadLimit("user-b").ok).toBe(true);
  });

  it("allows up to 20 conversions per hour per user", async () => {
    const { checkConversionLimit } = await import("./rate-limit");
    for (let i = 0; i < 20; i++) {
      expect(checkConversionLimit("user-c").ok).toBe(true);
    }
    const blocked = checkConversionLimit("user-c");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
});
