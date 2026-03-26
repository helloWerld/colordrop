"use client";

import {
  useState,
  useEffect,
  useRef,
  type RefObject,
} from "react";
import type { CropRectForBackground } from "@/lib/crop-background";

/**
 * Modal-aligned crop preview. Always draws the exact display-space crop
 * rectangle the user sees as the non-grey area in the crop editor.
 */
export function useUniformCropLayer(
  imageUrl: string,
  crop: CropRectForBackground,
  rotation_degrees: number | null | undefined,
): {
  containerRef: RefObject<HTMLDivElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
} {
  const containerRef = useRef<HTMLDivElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const [containerPx, setContainerPx] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const rotation = ((rotation_degrees ?? 0) % 360 + 360) % 360;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) {
        setContainerPx({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setNatural(null);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!natural || containerPx.w <= 0 || containerPx.h <= 0) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cw = containerPx.w;
      const ch = containerPx.h;
      const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const sourceCrop = {
        x: crop?.x ?? 0,
        y: crop?.y ?? 0,
        width: crop?.width ?? 1,
        height: crop?.height ?? 1,
      };
      const cropNormW =
        sourceCrop.width > 0 && sourceCrop.width <= 1 ? sourceCrop.width : 1;
      const cropNormH =
        sourceCrop.height > 0 && sourceCrop.height <= 1 ? sourceCrop.height : 1;
      const cropNormX = Math.max(0, Math.min(1 - cropNormW, sourceCrop.x));
      const cropNormY = Math.max(0, Math.min(1 - cropNormH, sourceCrop.y));

      const cropPxX = Math.round(cropNormX * imgW);
      const cropPxY = Math.round(cropNormY * imgH);
      const cropPxW = Math.max(1, Math.round(cropNormW * imgW));
      const cropPxH = Math.max(1, Math.round(cropNormH * imgH));

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropPxW;
      cropCanvas.height = cropPxH;
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) return;
      cropCtx.drawImage(
        img,
        cropPxX,
        cropPxY,
        cropPxW,
        cropPxH,
        0,
        0,
        cropPxW,
        cropPxH,
      );

      const rotatedW =
        rotation === 90 || rotation === 270 ? cropPxH : cropPxW;
      const rotatedH =
        rotation === 90 || rotation === 270 ? cropPxW : cropPxH;
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = rotatedW;
      rotatedCanvas.height = rotatedH;
      const rotatedCtx = rotatedCanvas.getContext("2d");
      if (!rotatedCtx) return;

      rotatedCtx.save();
      switch (rotation) {
        case 90:
          rotatedCtx.translate(rotatedW, 0);
          rotatedCtx.rotate(Math.PI / 2);
          break;
        case 180:
          rotatedCtx.translate(rotatedW, rotatedH);
          rotatedCtx.rotate(Math.PI);
          break;
        case 270:
          rotatedCtx.translate(0, rotatedH);
          rotatedCtx.rotate(-Math.PI / 2);
          break;
        default:
          break;
      }
      rotatedCtx.drawImage(cropCanvas, 0, 0, cropPxW, cropPxH);
      rotatedCtx.restore();

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const boxAR = cw / ch;
      const imgAR = rotatedW / rotatedH;
      const arEps = 1e-4;
      if (Math.abs(imgAR - boxAR) <= arEps) {
        ctx.drawImage(rotatedCanvas, 0, 0, cw, ch);
      } else {
        const scale = Math.max(cw / rotatedW, ch / rotatedH);
        const destW = rotatedW * scale;
        const destH = rotatedH * scale;
        ctx.drawImage(
          rotatedCanvas,
          0,
          0,
          rotatedW,
          rotatedH,
          0,
          0,
          destW,
          destH,
        );
      }
    };
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [natural, containerPx.w, containerPx.h, crop, rotation, imageUrl]);

  return { containerRef, canvasRef };
}
