import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone: the same mark, drawn large. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(45deg, #E2470F, #FF8A4C)",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 32 32">
          <path d="M5 24 C 11 23, 17 17, 24 10" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="2 2.5" fill="none" />
          <path d="M27 7 l-7.5 1.8 2.7 2.7 -1.8 7.5z" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
