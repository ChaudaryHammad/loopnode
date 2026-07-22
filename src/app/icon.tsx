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
          background: "#0A0C10",
          borderRadius: 8,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect x="3" y="6" width="4" height="20" rx="1" fill="#FFFFFF" />
          <rect x="9.5" y="6" width="4" height="20" rx="1" fill="#FFFFFF" />
          <rect x="16" y="6" width="4" height="20" rx="1" fill="#FFFFFF" />
          <rect x="22.5" y="6" width="4" height="20" rx="1" fill="#FFFFFF" />
          <rect
            x="29"
            y="6"
            width="2"
            height="20"
            rx="1"
            fill="#FFFFFF"
            opacity="0.35"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
