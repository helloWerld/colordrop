"use client";

import { useUniformCropLayer } from "@/hooks/use-uniform-crop-layer";
import type { CropRectInput } from "@/components/crop-rotate-editor";

export function PageTrimUniformPreview({
  imageUrl,
  crop_rect,
  rotation_degrees,
  ariaLabel = "Page preview",
}: {
  imageUrl: string;
  crop_rect?: CropRectInput;
  rotation_degrees?: number | null;
  ariaLabel?: string;
}) {
  const { containerRef, canvasRef } = useUniformCropLayer(
    imageUrl,
    crop_rect ?? null,
    rotation_degrees,
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-0 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label={ariaLabel}
      />
    </div>
  );
}
