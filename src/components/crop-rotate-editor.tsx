"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, RotateCw, Move, GripHorizontal } from "lucide-react";
import { displayToSourceCrop, sourceToDisplayCrop } from "@/lib/rotated-crop";

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropRectInput = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
} | null;

type CropRotateEditorProps = {
  imageUrl: string;
  cropRect: CropRectInput;
  rotationDegrees: number;
  /** Book aspect ratio: width / height (e.g. 7/10 for medium). */
  aspectRatio: number;
  /** Human-readable size label shown in the header, e.g. "8.5 × 11 in". */
  sizeLabel?: string;
  label: string;
  onSave: (cropRect: CropRect | null, rotationDegrees: number) => void;
  onCancel: () => void;
};

/**
 * Compute default crop rect anchored top-left in the image (normalized 0-1 image coords).
 * imageAspect = imagePixelWidth / imagePixelHeight.
 *
 * Crop rect is stored in source-image-fraction space.
 * To keep the crop rectangle visually portrait (book aspect) even when the image is rotated,
 * the target source-space ratio changes at 90°/270° because width/height swap in display space.
 */
function defaultCropRect(
  portraitAspect: number,
  imageAspect: number,
  rotation: number,
): CropRect {
  // r = target crop.width / crop.height in source-image-fraction space
  const r =
    rotation === 90 || rotation === 270
      ? 1 / (portraitAspect * imageAspect)
      : portraitAspect / imageAspect;
  if (r >= 1) {
    return { x: 0, y: 0, width: 1, height: 1 / r };
  }
  return { x: 0, y: 0, width: r, height: 1 };
}

/**
 * Clamp crop rect to [0,1] bounds and enforce portrait book aspect ratio.
 * rotation-aware for the same reason as defaultCropRect.
 */
function clampCrop(
  x: number,
  y: number,
  width: number,
  height: number,
  portraitAspect: number,
  imageAspect: number,
  rotation: number,
): CropRect {
  const r =
    rotation === 90 || rotation === 270
      ? 1 / (portraitAspect * imageAspect)
      : portraitAspect / imageAspect;

  let w = Math.max(0.01, Math.min(1, width));
  let h = w / r;
  if (h > 1) {
    h = 1;
    w = h * r;
  }
  return {
    x: Math.max(0, Math.min(1 - w, x)),
    y: Math.max(0, Math.min(1 - h, y)),
    width: w,
    height: h,
  };
}

/** Largest axis-aligned rect of aspect `imageAspect` (w/h) inside W×H. */
function fitImageRectInOuter(W: number, H: number, imageAspect: number) {
  let w = Math.min(W, H * imageAspect);
  let h = w / imageAspect;
  if (h > H) {
    h = H;
    w = h * imageAspect;
  }
  const left = (W - w) / 2;
  const top = (H - h) / 2;
  return { w, h, left, top };
}

/**
 * Map pointer position (outer px from top-left) to normalized coords on the
 * unrotated image box, undoing CSS rotation about the outer center.
 */
function clientToSourceNorm(
  px: number,
  py: number,
  W: number,
  H: number,
  imageAspect: number,
  rotationDeg: number,
): { nx: number; ny: number } {
  const { w: iw, h: ih } = fitImageRectInOuter(W, H, imageAspect);
  const cx = W / 2;
  const cy = H / 2;
  const rad = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const vx = px - cx;
  const vy = py - cy;
  const xr = vx * cos - vy * sin;
  const yr = vx * sin + vy * cos;
  const nx = (xr + iw / 2) / iw;
  const ny = (yr + ih / 2) / ih;
  return { nx, ny };
}

export function CropRotateEditor({
  imageUrl,
  cropRect: initialCropRect,
  rotationDegrees: initialRotation,
  aspectRatio,
  sizeLabel,
  label,
  onSave,
  onCancel,
}: CropRotateEditorProps) {
  const portraitAspect = Math.min(aspectRatio, 1 / aspectRatio);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [rotation, setRotation] = useState(initialRotation);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
  } | null>(null);
  const resizeStartRef = useRef<{
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);

  const imageAspect = imageSize ? imageSize.w / imageSize.h : 1;

  const displayAspect =
    imageSize && imageSize.h > 0
      ? rotation === 90 || rotation === 270
        ? imageSize.h / imageSize.w
        : imageSize.w / imageSize.h
      : 1;

  const [outerPx, setOuterPx] = useState({ w: 0, h: 0 });

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (!img.naturalWidth || !img.naturalHeight) return;
      const imgSize = { w: img.naturalWidth, h: img.naturalHeight };
      setImageSize(imgSize);
      const imgAspect = imgSize.w / imgSize.h;

      const w = initialCropRect?.width ?? 0;
      const h = initialCropRect?.height ?? 0;
      if (initialCropRect && w > 0 && h > 0) {
        setCrop(
          clampCrop(
            initialCropRect.x ?? 0,
            initialCropRect.y ?? 0,
            w,
            h,
            portraitAspect,
            imgAspect,
            rotation,
          ),
        );
      } else {
        setCrop(defaultCropRect(portraitAspect, imgAspect, rotation));
      }
    },
    [initialCropRect, portraitAspect, rotation],
  );

  useEffect(() => {
    setImageSize(null);
    setCrop(null);
  }, [imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) {
        setOuterPx({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clamp = useCallback(
    (x: number, y: number, w: number, h: number) =>
      clampCrop(x, y, w, h, portraitAspect, imageAspect, rotation),
    [portraitAspect, imageAspect, rotation],
  );

  const handlePointerDownCrop = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!containerRef.current || !crop) return;
      const rect = containerRef.current.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const { nx, ny } = clientToSourceNorm(
        e.clientX - rect.left,
        e.clientY - rect.top,
        W,
        H,
        imageAspect,
        rotation,
      );
      dragStartRef.current = {
        x: nx,
        y: ny,
        cropX: crop.x,
        cropY: crop.y,
        cropW: crop.width,
        cropH: crop.height,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [crop, imageAspect, rotation],
  );

  const handlePointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!containerRef.current || !crop) return;
      const rect = containerRef.current.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const { nx, ny } = clientToSourceNorm(
        e.clientX - rect.left,
        e.clientY - rect.top,
        W,
        H,
        imageAspect,
        rotation,
      );
      resizeStartRef.current = {
        cropX: crop.x,
        cropY: crop.y,
        cropW: crop.width,
        cropH: crop.height,
        pointerX: nx,
        pointerY: ny,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [crop, imageAspect, rotation],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const { nx, ny } = clientToSourceNorm(
        e.clientX - rect.left,
        e.clientY - rect.top,
        W,
        H,
        imageAspect,
        rotation,
      );

      if (dragStartRef.current) {
        const {
          x: startX,
          y: startY,
          cropX: dx,
          cropY: dy,
          cropW: dw,
          cropH: dh,
        } = dragStartRef.current;
        const newX = Math.max(0, Math.min(1 - dw, dx + (nx - startX)));
        const newY = Math.max(0, Math.min(1 - dh, dy + (ny - startY)));
        setCrop(clamp(newX, newY, dw, dh));
        return;
      }
      if (resizeStartRef.current) {
        const { cropX, cropY } = resizeStartRef.current;
        const newW = Math.max(0.01, nx - cropX);
        const newH = Math.max(0.01, ny - cropY);
        setCrop(clamp(cropX, cropY, newW, newH));
      }
    };
    const onUp = () => {
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clamp, rotation, imageAspect]);

  const rotateBy = useCallback(
    (delta: number) => {
      if (!crop) {
        setRotation((r) => (r + delta + 360) % 360);
        return;
      }
      const oldRotation = rotation;
      const newRotation = (rotation + delta + 360) % 360;
      const stableDisplay = sourceToDisplayCrop(crop, oldRotation);
      const nextSource = displayToSourceCrop(stableDisplay, newRotation);
      setRotation(newRotation);
      setCrop(
        clampCrop(
          nextSource.x,
          nextSource.y,
          nextSource.width,
          nextSource.height,
          portraitAspect,
          imageAspect,
          newRotation,
        ),
      );
    },
    [crop, rotation, portraitAspect, imageAspect],
  );

  const rotateLeft = useCallback(() => rotateBy(-90), [rotateBy]);
  const rotateRight = useCallback(() => rotateBy(90), [rotateBy]);

  const handleSave = useCallback(() => {
    onSave(crop, rotation);
  }, [crop, rotation, onSave]);

  const overlay = (
    <div className="fixed inset-0 z-[100] flex min-h-dvh w-full items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="border-b border-border p-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Crop & rotate — {label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sizeLabel && (
              <span className="mr-2 font-medium text-foreground">
                {sizeLabel}
              </span>
            )}
            Drag the crop box to reposition it · Drag the bottom-right handle to
            resize
          </p>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-6 overflow-auto p-4 sm:flex-row">
          {/* Image + crop overlay */}
          <div className="flex w-full max-w-lg shrink-0 items-center justify-center">
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
              style={{
                aspectRatio: displayAspect,
                maxHeight: "min(70vh, 512px)",
              }}
            >
              {imageSize && outerPx.w > 0 && outerPx.h > 0 ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {(() => {
                    const { w: iw, h: ih } = fitImageRectInOuter(
                      outerPx.w,
                      outerPx.h,
                      imageAspect,
                    );
                    return (
                      <div
                        className="relative pointer-events-auto"
                        style={{
                          width: iw,
                          height: ih,
                          transform: `rotate(${rotation}deg)`,
                          transformOrigin: "center center",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt="Crop preview"
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                        {crop && (
                          <>
                            <div
                              className="pointer-events-none absolute inset-0"
                              style={{
                                background: "rgba(0,0,0,0.55)",
                                clipPath: `polygon(evenodd, 0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${crop.x * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${(crop.y + crop.height) * 100}%, ${(crop.x + crop.width) * 100}% ${(crop.y + crop.height) * 100}%, ${(crop.x + crop.width) * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${crop.y * 100}%)`,
                              }}
                            />
                            <div
                              role="presentation"
                              onPointerDown={handlePointerDownCrop}
                              className="absolute cursor-move"
                              style={{
                                left: `${crop.x * 100}%`,
                                top: `${crop.y * 100}%`,
                                width: `${crop.width * 100}%`,
                                height: `${crop.height * 100}%`,
                                border: "2px solid white",
                                boxShadow:
                                  "0 0 0 1px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.2)",
                                touchAction: "none",
                              }}
                            >
                              {(
                                [
                                  "top-0 left-0",
                                  "top-0 right-0",
                                  "bottom-0 left-0",
                                ] as const
                              ).map((pos) => (
                                <div
                                  key={pos}
                                  className={`pointer-events-none absolute ${pos} h-3 w-3 rounded-sm bg-white shadow-sm`}
                                  style={{ margin: "-2px" }}
                                />
                              ))}
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="rounded-full bg-black/40 p-1.5">
                                  <Move className="h-4 w-4 text-white/80" />
                                </div>
                              </div>
                              <div
                                role="presentation"
                                onPointerDown={handlePointerDownResize}
                                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-se-resize items-center justify-center rounded-tl-md bg-white/90 shadow-md"
                                style={{ margin: "-1px", touchAction: "none" }}
                                title="Drag to resize"
                              >
                                <GripHorizontal className="h-4 w-4 text-gray-700" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  className="absolute inset-0 h-full w-full object-contain"
                  onLoad={handleImageLoad}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            {/* Rotation */}
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Rotation
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={rotateLeft}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/60 hover:bg-muted/50"
                  title="Rotate 90° left"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Left</span>
                </button>
                <span className="min-w-[3rem] text-center text-sm font-semibold tabular-nums text-foreground">
                  {rotation}°
                </span>
                <button
                  type="button"
                  onClick={rotateRight}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/60 hover:bg-muted/50"
                  title="Rotate 90° right"
                >
                  <span>Right</span>
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Usage hint */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Tips</p>
              <ul className="space-y-1">
                <li>
                  • Drag the crop box to choose what area of your photo appears
                  on the page.
                </li>
                <li>
                  • Drag the white handle in the bottom-right corner to resize
                  the crop area.
                </li>
                <li>
                  • The crop box is locked to your book&apos;s page proportions.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!crop}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }
  return createPortal(overlay, document.body);
}
