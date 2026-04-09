import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createPrintJob,
  type CreatePrintJobParams,
} from "@/lib/lulu";
import { logIntegrationEvent } from "@/lib/integration-events";

/** Max attempts for Lulu print-job submission (transient API errors). */
export const LULU_PRINT_JOB_MAX_ATTEMPTS = 5;
const LULU_RETRY_BASE_MS = 2000;
const LULU_RETRY_MAX_MS = 60_000;
const LULU_RETRY_FACTOR = 2;

/** Signed URL lifetime for PDFs passed to Lulu as `source_url` (Supabase storage). Keep long enough for delayed fetch/normalization after print-job creation; refreshed on each submit retry. */
export const SIGNED_URL_TTL_SEC = 604800; // 7 days

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 0-based attempt index → delay before the next attempt (after a failure). */
export function luluRetryDelayMsAfterFailure(attemptIndexZeroBased: number): number {
  return Math.min(
    LULU_RETRY_BASE_MS * LULU_RETRY_FACTOR ** attemptIndexZeroBased,
    LULU_RETRY_MAX_MS,
  );
}

type CreateJobFn = (params: CreatePrintJobParams) => Promise<number>;

/**
 * Calls Lulu `createPrintJob` with exponential backoff on failure.
 * Refreshes signed PDF URLs before each attempt so they do not expire mid-retry.
 */
export async function createPrintJobWithRetries(
  supabase: SupabaseClient,
  interiorPath: string,
  coverPdfPath: string,
  base: Omit<CreatePrintJobParams, "interiorPdfUrl" | "coverPdfUrl">,
  deps?: { createJob?: CreateJobFn; sleepFn?: (ms: number) => Promise<void> },
): Promise<number> {
  const createJob = deps?.createJob ?? createPrintJob;
  const sleepFn = deps?.sleepFn ?? sleep;

  let lastErr: Error = new Error("Lulu print job failed");

  for (let attempt = 0; attempt < LULU_PRINT_JOB_MAX_ATTEMPTS; attempt++) {
    const interiorSigned = await supabase.storage
      .from("pdfs")
      .createSignedUrl(interiorPath, SIGNED_URL_TTL_SEC);
    const coverSigned = await supabase.storage
      .from("pdfs")
      .createSignedUrl(coverPdfPath, SIGNED_URL_TTL_SEC);

    if (!interiorSigned.data?.signedUrl || !coverSigned.data?.signedUrl) {
      throw new Error("Could not create signed URLs for Lulu");
    }

    try {
      const printJobId = await createJob({
        ...base,
        interiorPdfUrl: interiorSigned.data.signedUrl,
        coverPdfUrl: coverSigned.data.signedUrl,
      });
      await logIntegrationEvent(
        {
          provider: "lulu",
          eventType: "print_job.submit.success",
          severity: "info",
          status: "success",
          orderId: base.externalId,
          luluPrintJobId: printJobId,
          attempt: attempt + 1,
        },
        supabase,
      );
      return printJobId;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      await logIntegrationEvent(
        {
          provider: "lulu",
          eventType: "print_job.submit.failed_attempt",
          severity: "warn",
          status: "retrying",
          orderId: base.externalId,
          attempt: attempt + 1,
          errorMessage: lastErr.message,
        },
        supabase,
      );
      if (attempt + 1 < LULU_PRINT_JOB_MAX_ATTEMPTS) {
        await sleepFn(luluRetryDelayMsAfterFailure(attempt));
      }
    }
  }

  throw lastErr;
}
