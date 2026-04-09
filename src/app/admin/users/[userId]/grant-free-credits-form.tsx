"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MAX_ADMIN_FREE_CREDITS_PER_REQUEST } from "@/lib/admin-free-credits";

type Props = {
  userId: string;
};

export function AdminGrantFreeCreditsForm({ userId }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const n = parseInt(amount, 10);
    if (!Number.isInteger(n) || n < 1) {
      setMessage({
        type: "err",
        text: "Enter a whole number of credits (at least 1).",
      });
      return;
    }
    if (n > MAX_ADMIN_FREE_CREDITS_PER_REQUEST) {
      setMessage({
        type: "err",
        text: `Maximum per request is ${MAX_ADMIN_FREE_CREDITS_PER_REQUEST}.`,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditsToAdd: n,
          reason: reason.trim() || undefined,
        }),
      });
      const body = (await res.json()) as { error?: string; free_conversions_remaining?: number };
      if (!res.ok) {
        setMessage({
          type: "err",
          text: body.error ?? "Request failed",
        });
        return;
      }
      setMessage({
        type: "ok",
        text: `Added ${n} free credits. New balance: ${body.free_conversions_remaining ?? "—"}.`,
      });
      setAmount("");
      setReason("");
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 space-y-2 rounded-md border border-dashed p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">
        Add free credits (1–{MAX_ADMIN_FREE_CREDITS_PER_REQUEST} per request)
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Credits</span>
          <input
            type="number"
            name="creditsToAdd"
            min={1}
            max={MAX_ADMIN_FREE_CREDITS_PER_REQUEST}
            step={1}
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            className="h-9 w-24 rounded-md border bg-background px-2 text-sm"
            disabled={loading}
            aria-label="Number of free credits to add"
          />
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Reason (optional)</span>
          <input
            type="text"
            name="reason"
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
            placeholder="e.g. support goodwill"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            disabled={loading}
            maxLength={500}
            aria-label="Optional reason for credit grant"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add credits"}
        </button>
      </div>
      {message ? (
        <p
          role="status"
          className={
            message.type === "ok"
              ? "text-sm text-green-700 dark:text-green-400"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
