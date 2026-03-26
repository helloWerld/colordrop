"use client";

import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CoverPrintPreview } from "@/components/cover-print-preview";
import type { CropRectInput } from "@/components/crop-rotate-editor";
import { PageTrimUniformPreview } from "@/components/page-trim-uniform-preview";

export type PreviewPageItem = {
  url: string;
  crop_rect: CropRectInput;
  rotation_degrees: number | null;
};

function trimFrameStyle(
  trimAspectRatio: number,
  mode: "carousel" | "zoom",
): CSSProperties {
  const safe =
    trimAspectRatio > 0 && Number.isFinite(trimAspectRatio)
      ? trimAspectRatio
      : 1;
  if (mode === "carousel") {
    return {
      aspectRatio: safe,
      width: `min(100%, calc(60vh * ${safe}))`,
    };
  }
  return {
    aspectRatio: safe,
    width: `min(90vw, calc(90vh * ${safe}))`,
    maxHeight: "90vh",
  };
}

export function PreviewClient({
  bookId,
  title,
  coverUrl,
  coverCropRect,
  coverRotation,
  trimAspectRatio,
  previewPages,
  pageCount,
}: {
  bookId: string;
  title: string;
  coverUrl: string | null;
  coverCropRect: CropRectInput;
  coverRotation: number | null;
  trimAspectRatio: number;
  previewPages: PreviewPageItem[];
  pageCount: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const totalSlides = (coverUrl ? 1 : 0) + previewPages.length;
  const hasCover = !!coverUrl;

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(totalSlides - 1, i + 1));

  const pageIndex = hasCover ? currentIndex - 1 : currentIndex;
  const currentPage =
    !isNaN(pageIndex) && pageIndex >= 0
      ? (previewPages[pageIndex] ?? null)
      : null;
  const currentLabel =
    hasCover && currentIndex === 0 ? "Cover" : `Page ${currentIndex + 1}`;
  const isCoverSlide = hasCover && currentIndex === 0;
  const canZoom = totalSlides > 0;

  const carouselTrimStyle = trimFrameStyle(trimAspectRatio, "carousel");
  const zoomTrimStyle = trimFrameStyle(trimAspectRatio, "zoom");

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div
          className="flex min-h-[200px] cursor-zoom-in items-center justify-center bg-muted/20 p-4"
          role="button"
          tabIndex={0}
          onClick={() => canZoom && setZoomOpen(true)}
          onKeyDown={(e) =>
            canZoom &&
            (e.key === "Enter" || e.key === " ") &&
            setZoomOpen(true)
          }
        >
          {totalSlides === 0 ? (
            <p className="text-muted-foreground">No pages yet.</p>
          ) : (
            <div
              className="min-h-0 min-w-0 overflow-hidden rounded-lg border border-border bg-muted"
              style={carouselTrimStyle}
            >
              {isCoverSlide && coverUrl ? (
                <CoverPrintPreview
                  coverUrl={coverUrl}
                  crop_rect={coverCropRect}
                  rotation_degrees={coverRotation}
                  trimAspectRatio={trimAspectRatio}
                  fillParent
                  maxWidthClassName="h-full w-full max-w-none"
                  className="h-full min-h-0 w-full max-h-none rounded-none border-0"
                />
              ) : currentPage ? (
                <div className="relative h-full w-full min-h-0">
                  <PageTrimUniformPreview
                    imageUrl={currentPage.url}
                    crop_rect={currentPage.crop_rect}
                    rotation_degrees={currentPage.rotation_degrees}
                    ariaLabel={currentLabel}
                  />
                </div>
              ) : null}
            </div>
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

      {zoomOpen && canZoom && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex min-h-dvh w-full items-center justify-center bg-black/90 p-4"
              onClick={() => setZoomOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Full resolution view"
            >
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="absolute right-4 top-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                Close
              </button>
              <div
                onClick={(e) => e.stopPropagation()}
                className="min-h-0 min-w-0 overflow-hidden rounded-lg border border-border/60 bg-muted/10"
                style={zoomTrimStyle}
              >
                {isCoverSlide && coverUrl ? (
                  <CoverPrintPreview
                    coverUrl={coverUrl}
                    crop_rect={coverCropRect}
                    rotation_degrees={coverRotation}
                    trimAspectRatio={trimAspectRatio}
                    fillParent
                    maxWidthClassName="h-full w-full max-w-none"
                    className="h-full min-h-0 w-full max-h-none rounded-none border-0 bg-muted/10"
                  />
                ) : currentPage ? (
                  <div className="relative h-full w-full min-h-0">
                    <PageTrimUniformPreview
                      imageUrl={currentPage.url}
                      crop_rect={currentPage.crop_rect}
                      rotation_degrees={currentPage.rotation_degrees}
                      ariaLabel={currentLabel}
                    />
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{pageCount} pages</p>
        </div>
        <Link
          href={`/dashboard/books/${bookId}/checkout`}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Order My Book
        </Link>
      </div>
    </>
  );
}
