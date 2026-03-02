"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-heading text-xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-center text-muted-foreground">
        We ran into an error. You can try again or go back home.
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
          href="/"
          className="rounded-full border border-border px-6 py-3 font-medium hover:bg-muted/50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
