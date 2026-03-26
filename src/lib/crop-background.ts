import type { CSSProperties } from "react";

export type CropRectForBackground = {
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
} | null;

/**
 * Map normalized source-space crop (0–1) to CSS background-size/position so the
 * crop region fills the element. Matches page thumbnails and print crop math.
 */
export function getBackgroundStylesFromCrop(
  imageUrl: string | null | undefined,
  crop: CropRectForBackground,
): CSSProperties {
  if (!imageUrl) {
    return {};
  }
  const width = crop?.width ?? 1;
  const height = crop?.height ?? 1;
  const x = crop?.x ?? 0;
  const y = crop?.y ?? 0;

  if (width <= 0 || height <= 0 || width > 1 || height > 1) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${100 / width}% ${100 / height}%`,
    backgroundPosition: `${-(x * 100) / width}% ${-(y * 100) / height}%`,
  };
}

/**
 * Same crop semantics as PDF (`generateCoverPdf` / interior): uniform scale
 * `max(containerW/(cw·imgW), containerH/(ch·imgH))`, then clip—no non-uniform stretch.
 */
export function getBackgroundCoverCropStyles(
  imageUrl: string | null | undefined,
  crop: CropRectForBackground,
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
): CSSProperties {
  if (!imageUrl) {
    return {};
  }
  const cw = crop?.width ?? 1;
  const ch = crop?.height ?? 1;
  const cx = crop?.x ?? 0;
  const cy = crop?.y ?? 0;

  if (
    containerW <= 0 ||
    containerH <= 0 ||
    imgW <= 0 ||
    imgH <= 0 ||
    cw <= 0 ||
    ch <= 0 ||
    cw > 1 ||
    ch > 1
  ) {
    return getBackgroundStylesFromCrop(imageUrl, crop);
  }

  const cropPxW = cw * imgW;
  const cropPxH = ch * imgH;
  const scaleX = containerW / cropPxW;
  const scaleY = containerH / cropPxH;
  const scale = Math.max(scaleX, scaleY);

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${imgW * scale}px ${imgH * scale}px`,
    backgroundPosition: `${-cx * imgW * scale}px ${-cy * imgH * scale}px`,
    backgroundRepeat: "no-repeat",
  };
}
