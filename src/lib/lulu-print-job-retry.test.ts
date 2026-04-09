import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreatePrintJobParams } from "@/lib/lulu";
import {
  LULU_PRINT_JOB_MAX_ATTEMPTS,
  SIGNED_URL_TTL_SEC,
  createPrintJobWithRetries,
  luluRetryDelayMsAfterFailure,
} from "@/lib/lulu-print-job-retry";

function mockSupabase(): {
  client: SupabaseClient;
  createSignedUrl: ReturnType<typeof vi.fn>;
} {
  const createSignedUrl = vi.fn().mockResolvedValue({
    data: { signedUrl: "https://example.test/signed.pdf" },
  });
  const client = {
    storage: {
      from: vi.fn().mockReturnValue({ createSignedUrl }),
    },
  } as unknown as SupabaseClient;
  return { client, createSignedUrl };
}

const baseJob: Omit<CreatePrintJobParams, "interiorPdfUrl" | "coverPdfUrl"> = {
  contactEmail: "a@b.c",
  externalId: "order-1",
  title: "Book",
  podPackageId: "pod",
  shippingAddress: {
    name: "n",
    street1: "s",
    city: "c",
    state_code: "CA",
    country_code: "US",
    postcode: "90210",
    phone_number: "1",
  },
  shippingLevel: "MAIL",
};

describe("luluRetryDelayMsAfterFailure", () => {
  it("exponential backoff before cap", () => {
    expect(luluRetryDelayMsAfterFailure(0)).toBe(2000);
    expect(luluRetryDelayMsAfterFailure(1)).toBe(4000);
    expect(luluRetryDelayMsAfterFailure(2)).toBe(8000);
  });

  it("caps at max", () => {
    expect(luluRetryDelayMsAfterFailure(20)).toBe(60_000);
  });
});

describe("createPrintJobWithRetries", () => {
  it("uses SIGNED_URL_TTL_SEC for interior and cover signed URLs", async () => {
    const { client, createSignedUrl } = mockSupabase();
    const createJob = vi.fn().mockResolvedValue(1);
    await createPrintJobWithRetries(client, "user/in.pdf", "user/cov.pdf", baseJob, {
      createJob,
      sleepFn: () => Promise.resolve(),
    });
    expect(createSignedUrl).toHaveBeenCalledWith("user/in.pdf", SIGNED_URL_TTL_SEC);
    expect(createSignedUrl).toHaveBeenCalledWith("user/cov.pdf", SIGNED_URL_TTL_SEC);
  });

  it("returns on first success", async () => {
    const createJob = vi.fn().mockResolvedValue(42);
    const { client } = mockSupabase();
    const id = await createPrintJobWithRetries(
      client,
      "in.pdf",
      "cov.pdf",
      baseJob,
      { createJob, sleepFn: () => Promise.resolve() },
    );
    expect(id).toBe(42);
    expect(createJob).toHaveBeenCalledTimes(1);
  });

  it("retries until success", async () => {
    const createJob = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValue(99);
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const { client } = mockSupabase();
    const id = await createPrintJobWithRetries(
      client,
      "in.pdf",
      "cov.pdf",
      baseJob,
      { createJob, sleepFn },
    );
    expect(id).toBe(99);
    expect(createJob).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2);
  });

  it("throws after max attempts", async () => {
    const createJob = vi.fn().mockRejectedValue(new Error("always"));
    const { client } = mockSupabase();
    await expect(
      createPrintJobWithRetries(client, "in.pdf", "cov.pdf", baseJob, {
        createJob,
        sleepFn: () => Promise.resolve(),
      }),
    ).rejects.toThrow("always");
    expect(createJob).toHaveBeenCalledTimes(LULU_PRINT_JOB_MAX_ATTEMPTS);
  });
});
