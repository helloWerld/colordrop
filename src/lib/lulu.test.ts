import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("luluDashboardPrintJobLink", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("LULU_USE_SANDBOX", undefined);
    vi.stubEnv("LULU_SANDBOX_CLIENT_KEY", undefined);
    vi.stubEnv("LULU_SANDBOX_CLIENT_SECRET", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns sandbox dashboard link when sandbox is active", async () => {
    vi.stubEnv("LULU_USE_SANDBOX", "true");
    vi.stubEnv("LULU_SANDBOX_CLIENT_KEY", "key");
    vi.stubEnv("LULU_SANDBOX_CLIENT_SECRET", "secret");
    const { luluDashboardPrintJobLink } = await import("./lulu");
    expect(luluDashboardPrintJobLink(12345)).toBe(
      "https://developers.sandbox.lulu.com/print-jobs/detail/12345",
    );
  });

  it("returns production dashboard link when sandbox is not active", async () => {
    vi.stubEnv("LULU_USE_SANDBOX", "false");
    const { luluDashboardPrintJobLink } = await import("./lulu");
    expect(luluDashboardPrintJobLink(12345)).toBe(
      "https://developers.lulu.com/print-jobs/detail/12345",
    );
  });

  it("falls back to production URL when sandbox flag is true but sandbox keys are missing", async () => {
    vi.stubEnv("LULU_USE_SANDBOX", "true");
    const { luluDashboardPrintJobLink } = await import("./lulu");
    expect(luluDashboardPrintJobLink("987")).toBe(
      "https://developers.lulu.com/print-jobs/detail/987",
    );
  });
});
