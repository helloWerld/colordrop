"use client";

import { useState } from "react";

export function DeleteAccountSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to delete account");
        return;
      }
      window.location.href = "/";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-muted/20 p-6">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Account
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Permanently delete your account and all associated data (saved pages,
        books, profile). This cannot be undone.
      </p>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="mt-4 text-sm font-medium text-destructive hover:underline"
      >
        Delete my account
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg max-w-sm">
            <p className="font-medium text-foreground">Delete your account?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete your account and all your data. You
              will be signed out. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
