"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddTestCreditsButton({ isDev }: { isDev: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!isDev) return null;

  const handleAdd = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dev/add-free-credits", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(data.message ?? `Added ${data.added ?? 20} free credits.`);
        router.refresh();
      } else {
        setMessage(data.error ?? "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className="text-xs text-muted-foreground underline hover:no-underline disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add 20 test credits (dev only)"}
      </button>
      {message && (
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
