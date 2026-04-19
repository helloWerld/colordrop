import sharp from "sharp";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(",");
  if (comma < 0 || !dataUrl.startsWith("data:")) {
    throw new Error("Invalid data URL for outline image.");
  }
  const header = dataUrl.slice(5, comma);
  if (!header.includes("base64")) {
    throw new Error("Outline data URL must be base64-encoded.");
  }
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

async function loadOutlineBuffer(outlineSource: string): Promise<Buffer> {
  if (outlineSource.startsWith("data:")) {
    return dataUrlToBuffer(outlineSource);
  }
  const res = await fetch(outlineSource);
  if (!res.ok) {
    throw new Error(`Failed to fetch outline image: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Scale outline line art to exact pixel dimensions (contain on white) so the
 * output matches the original upload canvas without cropping the artwork.
 */
export async function resizeLineartOutputToDataUrl(
  outlineSource: string,
  targetWidth: number,
  targetHeight: number,
): Promise<string> {
  const input = await loadOutlineBuffer(outlineSource);
  const out = await sharp(input)
    .resize(targetWidth, targetHeight, {
      fit: "contain",
      position: "centre",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
  return `data:image/png;base64,${out.toString("base64")}`;
}
