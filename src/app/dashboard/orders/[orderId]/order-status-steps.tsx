"use client";

import { Check } from "lucide-react";
import { Highlighter } from "@/components/ui/highlighter";

export type OrderStatusStep = { id: string; label: string };

export function OrderStatusSteps({
  steps,
  currentStepIndex,
  hasError,
  errorMessage,
  isPending,
  isRefunded,
}: {
  steps: OrderStatusStep[];
  currentStepIndex: number;
  hasError?: boolean;
  errorMessage?: string | null;
  isPending?: boolean;
  /** Fulfillment could not complete; payment was returned */
  isRefunded?: boolean;
}) {
  const frozen = Boolean(hasError || isPending || isRefunded);

  return (
    <div className="mt-4 space-y-3">
      {isRefunded && (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
          This order was refunded because we could not fulfill it. You can open
          your book from the dashboard and try checkout again when you are
          ready.
        </p>
      )}
      {hasError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage?.trim()
            ? errorMessage
            : "Something went wrong with this order. Contact support if you need help."}
        </p>
      )}
      {isPending && !hasError && (
        <p className="text-sm text-muted-foreground">
          Awaiting payment confirmation.
        </p>
      )}
      <ul className="space-y-2">
        {steps.map((step, i) => {
          const completed =
            !frozen && currentStepIndex >= 0 && i < currentStepIndex;
          const current =
            !frozen && currentStepIndex >= 0 && i === currentStepIndex;
          const upcoming = frozen || i > currentStepIndex;

          return (
            <li key={step.id} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                aria-hidden
              >
                {completed ? (
                  <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                ) : (
                  <span className="block h-2 w-2 rounded-full bg-muted-foreground/25" />
                )}
              </span>
              <span
                className={
                  upcoming
                    ? "text-sm text-muted-foreground/70"
                    : "text-sm font-medium text-foreground"
                }
              >
                {current ? (
                  <Highlighter
                    action="highlight"
                    color="#ffde00"
                    isView
                    multiline={false}
                  >
                    {step.label}
                  </Highlighter>
                ) : (
                  step.label
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
