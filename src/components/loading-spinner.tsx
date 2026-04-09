"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export type LoadingSpinnerSize = keyof typeof sizeClasses;

type LoadingSpinnerProps = {
  size?: LoadingSpinnerSize;
  className?: string;
  /** When true, icon only (no role/status); use when adjacent text describes the state. */
  decorative?: boolean;
  label?: string;
};

export function LoadingSpinner({
  size = "md",
  className,
  decorative = false,
  label = "Loading",
}: LoadingSpinnerProps) {
  if (decorative) {
    return (
      <Loader2
        className={cn("animate-spin", sizeClasses[size], className)}
        aria-hidden
      />
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center justify-center"
    >
      <Loader2
        className={cn("animate-spin", sizeClasses[size], className)}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

type PageLoadingProps = {
  className?: string;
  spinnerSize?: LoadingSpinnerSize;
  label?: string;
};

export function PageLoading({
  className,
  spinnerSize = "lg",
  label = "Loading page",
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] w-full flex-col items-center justify-center",
        className,
      )}
      aria-live="polite"
    >
      <LoadingSpinner size={spinnerSize} label={label} />
    </div>
  );
}
