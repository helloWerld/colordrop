"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard]", error);
  }, [error]);

  const message = error?.message ?? "Something went wrong";

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-heading text-xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        {message}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground/80">
        Check the terminal for server errors (e.g. missing Supabase env or DB).
      </p>
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Dashboard
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
