import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase";

type Provider = "stripe" | "lulu" | "conversion" | "system";
type Severity = "debug" | "info" | "warn" | "error";

type IntegrationEventInput = {
  provider: Provider;
  eventType: string;
  severity?: Severity;
  status?: string | null;
  orderId?: string | null;
  bookId?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  luluPrintJobId?: number | null;
  attempt?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  payload?: unknown;
};

function truncateError(message: string | null | undefined): string | null {
  if (!message) return null;
  return message.length > 2000 ? `${message.slice(0, 2000)}...` : message;
}

export async function logIntegrationEvent(
  input: IntegrationEventInput,
  supabaseClient?: SupabaseClient,
): Promise<void> {
  try {
    const supabase = supabaseClient ?? createServerSupabaseClient();
    await supabase.from("integration_events").insert({
      provider: input.provider,
      event_type: input.eventType,
      severity: input.severity ?? "info",
      status: input.status ?? null,
      order_id: input.orderId ?? null,
      book_id: input.bookId ?? null,
      stripe_session_id: input.stripeSessionId ?? null,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      lulu_print_job_id: input.luluPrintJobId ?? null,
      attempt: input.attempt ?? null,
      error_code: input.errorCode ?? null,
      error_message: truncateError(input.errorMessage),
      payload: input.payload ?? null,
    });
  } catch (error) {
    console.error("[integration-events] failed to persist event", {
      provider: input.provider,
      eventType: input.eventType,
      error,
    });
  }
}
