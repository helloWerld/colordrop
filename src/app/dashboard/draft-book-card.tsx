"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getProductByTrimCode } from "@/lib/book-products";

type DraftBookCardProps = {
  id: string;
  title: string | null;
  page_count: number | null;
  page_tier?: number | null;
  trim_size?: string | null;
};

export function DraftBookCard({
  id,
  title,
  page_count,
  page_tier,
  trim_size,
}: DraftBookCardProps) {
  const product = trim_size ? getProductByTrimCode(trim_size) : null;
  const sizeLabel = product
    ? `${product.label} (${product.widthInches}" × ${product.heightInches}")`
    : null;
  const count = page_count ?? 0;
  const pagesLabel =
    page_tier != null && page_tier > 0
      ? `${count} of ${page_tier} pages`
      : `${count} pages`;
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "Delete this book? Your images in My Saved Pages will not be affected.",
      )
    )
      return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.status === 204) {
      router.refresh();
      return;
    }
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Cannot delete this book.");
      return;
    }
    if (res.status === 404) {
      router.refresh();
      return;
    }
    alert("Failed to delete book.");
  };

  return (
    <div className="relative flex min-w-52 flex-col rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/50">
      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-2 top-2 z-10 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
        aria-label="Delete book"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <Link
        href={`/dashboard/books/${id}`}
        className="relative z-0 flex flex-col after:absolute after:inset-0 after:z-0"
      >
        <span className="font-medium text-foreground pr-8 line-clamp-1">
          {title?.trim() || "Untitled"}
        </span>
        <span className="text-sm text-foreground">{sizeLabel}</span>
        <span className="text-xs text-muted-foreground">{pagesLabel}</span>
        <span className="mt-2 text-sm text-primary">Continue →</span>
      </Link>
    </div>
  );
}
