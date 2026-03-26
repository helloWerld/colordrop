"use client";

import { useUniformCropLayer } from "@/hooks/use-uniform-crop-layer";
import type { CropRectInput } from "@/components/crop-rotate-editor";

export type CoverPrintPreviewProps = {
  coverUrl: string;
  crop_rect?: CropRectInput;
  rotation_degrees?: number | null;
  /** Trim width / height (e.g. product.widthInches / product.heightInches). */
  trimAspectRatio: number;
  className?: string;
  /** Outer frame max width, e.g. max-w-[200px] */
  maxWidthClassName?: string;
  /** When true, omit aspect-ratio on this root and fill the parent trim box. */
  fillParent?: boolean;
};

export function CoverPrintPreview({
  coverUrl,
  crop_rect,
  rotation_degrees,
  trimAspectRatio,
  className = "",
  maxWidthClassName = "max-w-[200px]",
  fillParent = false,
}: CoverPrintPreviewProps) {
  const safeTrim =
    trimAspectRatio > 0 && Number.isFinite(trimAspectRatio)
      ? trimAspectRatio
      : 1;

  const { containerRef, canvasRef } = useUniformCropLayer(
    coverUrl,
    crop_rect ?? null,
    rotation_degrees,
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg border border-border bg-muted ${maxWidthClassName} ${className}`}
      style={fillParent ? undefined : { aspectRatio: `${safeTrim}` }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="Cover preview"
      />
    </div>
  );
}
