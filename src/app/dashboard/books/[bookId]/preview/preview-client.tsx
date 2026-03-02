"use client";

import { useState } from "react";
import Link from "next/link";

export function PreviewClient({
  bookId,
  title,
  coverUrl,
  pageUrls,
  pageCount,
  creditsAppliedCents,
}: {
  bookId: string;
  title: string;
  coverUrl: string | null;
  pageUrls: string[];
  pageCount: number;
  creditsAppliedCents: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const totalSlides = (coverUrl ? 1 : 0) + pageUrls.length;
  const hasCover = !!coverUrl;

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(totalSlides - 1, i + 1));

  const currentImageUrl =
    totalSlides === 0
      ? null
      : hasCover && currentIndex === 0
        ? coverUrl
        : pageUrls[hasCover ? currentIndex - 1 : currentIndex] ?? null;
  const currentLabel = hasCover && currentIndex === 0 ? "Cover" : `Page ${currentIndex + 1}`;

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div
          className="aspect-square max-h-[60vh] flex cursor-zoom-in items-center justify-center bg-muted/20"
          role="button"
          tabIndex={0}
          onClick={() => currentImageUrl && setZoomOpen(true)}
          onKeyDown={(e) => currentImageUrl && (e.key === "Enter" || e.key === " ") && setZoomOpen(true)}
        >
          {totalSlides === 0 ? (
            <p className="text-muted-foreground">No pages yet.</p>
          ) : hasCover && currentIndex === 0 ? (
            coverUrl && (
              <img
                src={coverUrl}
                alt="Cover"
                className="max-h-full w-auto object-contain"
              />
            )
          ) : (
            <img
              src={pageUrls[hasCover ? currentIndex - 1 : currentIndex]}
              alt={`Page ${currentIndex + 1}`}
              className="max-h-full w-auto object-contain"
            />
          )}
        </div>
        {totalSlides > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {totalSlides}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === totalSlides - 1}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {zoomOpen && currentImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full resolution view"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            Close
          </button>
          <img
            src={currentImageUrl}
            alt={currentLabel}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">
            {pageCount} pages
            {creditsAppliedCents > 0 &&
              ` · $${(creditsAppliedCents / 100).toFixed(2)} credit value at checkout`}
          </p>
        </div>
        <Link
          href={`/dashboard/books/${bookId}/checkout`}
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Order My Book
        </Link>
      </div>
    </>
  );
}
