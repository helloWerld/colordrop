import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ColorDrop — turn your photos into printed coloring books";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #faf8f5 0%, #eef6f0 50%, #f5f0fa 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: 48,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#1a1a1a",
            }}
          >
            ColorDrop
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#4a5568",
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            Turn your photos into custom printed coloring books
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
