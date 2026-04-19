import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { resizeLineartOutputToDataUrl } from "@/lib/resize-conversion-output";

describe("resizeLineartOutputToDataUrl", () => {
  it("contain-fits outline onto exact target dimensions with white letterboxing", async () => {
    const strip = await sharp({
      create: {
        width: 10,
        height: 40,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();
    const dataUrl = `data:image/png;base64,${strip.toString("base64")}`;
    const out = await resizeLineartOutputToDataUrl(dataUrl, 100, 100);
    const payload = out.split(",")[1];
    if (!payload) throw new Error("expected base64 payload");
    const buf = Buffer.from(payload, "base64");
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
  });
});
