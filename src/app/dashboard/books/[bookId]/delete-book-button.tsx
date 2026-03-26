"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [deletingBook, setDeletingBook] = useState(false);

  return (
    <div className="absolute top-0 right-0">
      <button
        type="button"
        disabled={deletingBook}
        onClick={async () => {
          if (
            !confirm(
              "Delete this book? The book and its pages will be removed. Your images in My Saved Pages are not affected.",
            )
          )
            return;
          setDeletingBook(true);
          try {
            const res = await fetch(`/api/books/${bookId}`, {
              method: "DELETE",
            });
            if (res.status === 204) {
              router.push("/dashboard");
              return;
            }
            if (res.status === 409) {
              const data = await res.json().catch(() => ({}));
              alert(data.error ?? "Cannot delete this book.");
              return;
            }
            if (res.status === 404) {
              router.push("/dashboard");
              return;
            }
            alert("Failed to delete book.");
          } finally {
            setDeletingBook(false);
          }
        }}
        className="flex flex-row gap-2 mt-3 rounded-lg border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground/20 hover:text-destructive hover:border-destructive disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {deletingBook ? "Deleting…" : `Trash`}
      </button>
    </div>
  );
}
