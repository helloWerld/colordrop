/**
 * PDF generation for ColorDrop: interior (coloring pages) and cover.
 * Interior: 8.5" x 8.5" (612 x 612 pt), one page per outline image at 300 DPI equivalent.
 * Cover: dimensions from Lulu API, single page.
 */

import { PDFDocument } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";

const TRIM_POINTS = 612; // 8.5" at 72 pt/in

/**
 * Download file from Supabase storage and return bytes.
 */
async function downloadStorageBytes(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new Error(`Failed to download ${bucket}/${path}: ${error?.message ?? "no data"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Generate interior PDF from book outline pages (in order).
 * Page size: 8.5" x 8.5" (612 x 612 pt). One PDF page per outline image.
 */
export async function generateInteriorPdf(
  supabase: SupabaseClient,
  outlinePaths: string[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const path of outlinePaths) {
    const imageBytes = await downloadStorageBytes(supabase, "outlines", path);
    const page = doc.addPage([TRIM_POINTS, TRIM_POINTS]);
    const png = await doc.embedPng(imageBytes);
    page.drawImage(png, {
      x: 0,
      y: 0,
      width: TRIM_POINTS,
      height: TRIM_POINTS,
    });
  }

  return doc.save();
}

/**
 * Generate cover PDF from cover image. Dimensions in points (1/72 inch).
 * Lulu expects a single-page PDF; back cover is blank for MVP.
 * Supports JPEG and PNG (cover uploads use jpg/png/webp; webp not embedded by pdf-lib).
 */
export async function generateCoverPdf(
  supabase: SupabaseClient,
  coverImagePath: string,
  widthPoints: number,
  heightPoints: number
): Promise<Uint8Array> {
  const imageBytes = await downloadStorageBytes(supabase, "covers", coverImagePath);
  const doc = await PDFDocument.create();
  const page = doc.addPage([widthPoints, heightPoints]);
  const isJpeg =
    coverImagePath.toLowerCase().endsWith(".jpg") ||
    coverImagePath.toLowerCase().endsWith(".jpeg") ||
    (imageBytes[0] === 0xff && imageBytes[1] === 0xd8);
  const image = isJpeg
    ? await doc.embedJpg(imageBytes)
    : await doc.embedPng(imageBytes);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: widthPoints,
    height: heightPoints,
  });
  return doc.save();
}
