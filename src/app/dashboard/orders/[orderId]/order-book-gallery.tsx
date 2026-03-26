"use client";

import { CoverPrintPreview } from "@/components/cover-print-preview";
import type { CropRectInput } from "@/components/crop-rotate-editor";
import { PageTrimUniformPreview } from "@/components/page-trim-uniform-preview";

export type OrderGalleryCover = {
  url: string;
  crop_rect: CropRectInput;
  rotation_degrees: number | null;
};

export type OrderGalleryPage = {
  url: string;
  crop_rect: CropRectInput;
  rotation_degrees: number | null;
  label: string;
};

export function OrderBookGallery({
  trimAspectRatio,
  cover,
  pages,
}: {
  trimAspectRatio: number;
  cover: OrderGalleryCover | null;
  pages: OrderGalleryPage[];
}) {
  if (!cover && pages.length === 0) return null;

  const safeTrim =
    trimAspectRatio > 0 && Number.isFinite(trimAspectRatio)
      ? trimAspectRatio
      : 1;

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {cover ? (
        <div className="min-h-0 min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Cover</p>
          <div
            className="min-h-0 w-full overflow-hidden rounded-lg border border-border bg-muted"
            style={{ aspectRatio: `${safeTrim}` }}
          >
            <CoverPrintPreview
              coverUrl={cover.url}
              crop_rect={cover.crop_rect}
              rotation_degrees={cover.rotation_degrees}
              trimAspectRatio={safeTrim}
              fillParent
              maxWidthClassName="h-full w-full max-w-none"
              className="h-full min-h-0 w-full max-h-none rounded-none border-0"
            />
          </div>
        </div>
      ) : null}
      {pages.map((p, idx) => (
        <div key={`${p.url}-${idx}`} className="min-h-0 min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
          <div
            className="min-h-0 w-full overflow-hidden rounded-lg border border-border bg-muted"
            style={{ aspectRatio: `${safeTrim}` }}
          >
            <div className="relative h-full w-full min-h-0">
              <PageTrimUniformPreview
                imageUrl={p.url}
                crop_rect={p.crop_rect}
                rotation_degrees={p.rotation_degrees}
                ariaLabel={p.label}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
