import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e1210",
          border: "1px solid #ff8a3d",
        }}
      >
        <span
          style={{
            color: "#ff8a3d",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "Helvetica, Arial, sans-serif",
            lineHeight: 1,
          }}
        >
          t/
        </span>
      </div>
    ),
    { ...size },
  );
}
