"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBookPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/books", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "Failed to create book");
        return;
      }
      if (data.book?.id) {
        router.replace(`/dashboard/books/${data.book.id}`);
      } else {
        setError("Invalid response");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        <p>{error}</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-muted-foreground">Creating your book...</p>
    </div>
  );
}
