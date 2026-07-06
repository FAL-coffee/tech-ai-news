import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "90px 100px",
          background: "#f7f5f0",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#a63e0f",
            marginBottom: 28,
          }}
        >
          <div style={{ width: 40, height: 2, background: "#a63e0f" }} />
          PRIMARY SOURCES ONLY
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, color: "#1c1a17", letterSpacing: -2 }}>
          tech<span style={{ color: "#a63e0f" }}>/</span>ai
          <span style={{ color: "#968f7d", fontWeight: 500 }}>&nbsp;news</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 30,
            color: "#6b6355",
            maxWidth: 900,
          }}
        >
          公式ブログ・公式アカウントの一次情報を、AIが日本語記事として再構成してお届けします。
        </div>
      </div>
    ),
    { ...size },
  );
}
