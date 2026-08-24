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
          background: "#0e1210",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#5ecbd0",
            marginBottom: 28,
          }}
        >
          [ PRIMARY SOURCES ONLY ]
        </div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, color: "#eef1ea", letterSpacing: -2 }}>
          tech<span style={{ color: "#ff8a3d" }}>/</span>ai
          <span style={{ color: "#5e6b5a", fontWeight: 500 }}>&nbsp;news</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 30,
            color: "#93a08f",
            maxWidth: 900,
          }}
        >
          公式ブログとリリースノートを、日本語の記事にして毎朝届けます。
        </div>
      </div>
    ),
    { ...size },
  );
}
