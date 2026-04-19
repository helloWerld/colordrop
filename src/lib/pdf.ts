/**
 * PDF generation for ColorDrop: interior (coloring pages) and cover.
 * Interior: trim-size aware; one PDF page per outline image; supports crop and rotation per page.
 * Cover: dimensions from Lulu API; single spread (back branding | spine | front).
 */

import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, degrees } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProductByTrimCode } from "@/lib/book-products";

const LEGACY_TRIM_POINTS = 612; // 8.5" at 72 pt/in for legacy books

const BACK_COVER_IMAGE_PATH = path.join(
  process.cwd(),
  "public",
  "backcover_image.png",
);
/** Max rendered width for back-cover branding (PDF points, 72 pt/in). */
const BACK_COVER_MAX_WIDTH_IN = 4;
const BACK_COVER_MAX_WIDTH_POINTS = BACK_COVER_MAX_WIDTH_IN * 72;

export type PageRow = {
  outline_image_path: string;
  crop_rect?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  rotation_degrees?: number | null;
};

/**
 * Download file from Supabase storage and return bytes.
 */
async function downloadStorageBytes(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(
      `Failed to download ${bucket}/${path}: ${error?.message ?? "no data"}`,
    );
  }
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Generate interior PDF from book outline pages (in order).
 * Page size from trim code (Pocket / Medium / Large); one PDF page per outline image.
 * Applies crop_rect (normalized 0-1) and rotation_degrees per page when set.
 */
export async function generateInteriorPdf(
  supabase: SupabaseClient,
  pageRows: PageRow[],
  trimCode: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const product = getProductByTrimCode(trimCode);
  const widthPoints = product?.widthPoints ?? LEGACY_TRIM_POINTS;
  const heightPoints = product?.heightPoints ?? LEGACY_TRIM_POINTS;

  for (const row of pageRows) {
    const path = row.outline_image_path;
    const imageBytes = await downloadStorageBytes(supabase, "outlines", path);
    const page = doc.addPage([widthPoints, heightPoints]);
    const png = await doc.embedPng(imageBytes);
    const imgW = png.width;
    const imgH = png.height;

    const crop = row.crop_rect;
    const rotation = row.rotation_degrees ?? 0;
    const cx = crop?.x ?? 0;
    const cy = crop?.y ?? 0;
    const cw = crop?.width ?? 1;
    const ch = crop?.height ?? 1;

    let drawWidth: number;
    let drawHeight: number;
    let drawX: number;
    let drawY: number;

    if (cw < 1 || ch < 1 || cx > 0 || cy > 0) {
      const scaleX = widthPoints / (cw * imgW);
      const scaleY = heightPoints / (ch * imgH);
      const scale = Math.max(scaleX, scaleY);
      drawWidth = imgW * scale;
      drawHeight = imgH * scale;
      drawX = -cx * imgW * scale;
      drawY = -cy * imgH * scale;
    } else {
      drawWidth = widthPoints;
      drawHeight = heightPoints;
      drawX = 0;
      drawY = 0;
    }

    page.drawImage(png, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
      rotate: degrees(rotation),
    });
  }

  return doc.save();
}

/**
 * Generate cover PDF from cover image. Dimensions in points (1/72 inch).
 * Lulu expects a single-page spread: static back-cover branding, blank spine, user front.
 * Supports JPEG and PNG (cover uploads use jpg/png/webp; webp not embedded by pdf-lib).
 * Applies crop_rect (normalized 0-1) and rotation_degrees when provided (same order as interior: crop then rotate).
 */
export async function generateCoverPdf(
  supabase: SupabaseClient,
  coverImagePath: string,
  widthPoints: number,
  heightPoints: number,
  trimCode: string,
  crop_rect?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null,
  rotation_degrees?: number | null,
): Promise<Uint8Array> {
  const imageBytes = await downloadStorageBytes(
    supabase,
    "covers",
    coverImagePath,
  );
  const doc = await PDFDocument.create();
  const page = doc.addPage([widthPoints, heightPoints]);
  const product = getProductByTrimCode(trimCode);
  const trimWidthPoints = product?.widthPoints ?? LEGACY_TRIM_POINTS;
  const trimHeightPoints = product?.heightPoints ?? LEGACY_TRIM_POINTS;
  const frontAspect = Math.min(trimWidthPoints / trimHeightPoints, 1);
  const frontWidthPoints = heightPoints * frontAspect;
  const spineWidthPoints = Math.max(0, widthPoints - 2 * frontWidthPoints);
  // Lulu wrap order: back | spine | front
  const frontX = frontWidthPoints + spineWidthPoints;
  const frontY = 0;
  const panelWidthPoints = frontWidthPoints;
  const panelHeightPoints = heightPoints;

  let backPngBytes: Uint8Array;
  try {
    backPngBytes = await readFile(BACK_COVER_IMAGE_PATH);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Back cover asset missing or unreadable at ${BACK_COVER_IMAGE_PATH}: ${msg}`,
    );
  }
  const backPng = await doc.embedPng(backPngBytes);
  const backImgW = backPng.width;
  const backImgH = backPng.height;
  // Cap width at 4" (and panel); uniform scale keeps aspect ratio.
  const backMaxWidthPoints = Math.min(
    panelWidthPoints,
    BACK_COVER_MAX_WIDTH_POINTS,
  );
  const backScale = Math.min(
    backMaxWidthPoints / backImgW,
    panelHeightPoints / backImgH,
  );
  const backDrawW = backImgW * backScale;
  const backDrawH = backImgH * backScale;
  const backDrawX = (panelWidthPoints - backDrawW) / 2;
  const backDrawY = (panelHeightPoints - backDrawH) / 2;
  page.drawImage(backPng, {
    x: backDrawX,
    y: backDrawY,
    width: backDrawW,
    height: backDrawH,
  });

  const isJpeg =
    coverImagePath.toLowerCase().endsWith(".jpg") ||
    coverImagePath.toLowerCase().endsWith(".jpeg") ||
    (imageBytes[0] === 0xff && imageBytes[1] === 0xd8);
  const image = isJpeg
    ? await doc.embedJpg(imageBytes)
    : await doc.embedPng(imageBytes);
  const imgW = image.width;
  const imgH = image.height;

  const crop = crop_rect;
  const rotation = rotation_degrees ?? 0;
  const cx = crop?.x ?? 0;
  const cy = crop?.y ?? 0;
  const cw = crop?.width ?? 1;
  const ch = crop?.height ?? 1;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (cw < 1 || ch < 1 || cx > 0 || cy > 0) {
    const scaleX = panelWidthPoints / (cw * imgW);
    const scaleY = panelHeightPoints / (ch * imgH);
    const scale = Math.max(scaleX, scaleY);
    drawWidth = imgW * scale;
    drawHeight = imgH * scale;
    drawX = frontX + -cx * imgW * scale;
    drawY = frontY + -cy * imgH * scale;
  } else {
    drawWidth = panelWidthPoints;
    drawHeight = panelHeightPoints;
    drawX = frontX;
    drawY = frontY;
  }

  page.drawImage(image, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
    rotate: degrees(rotation),
  });
  return doc.save();
}
