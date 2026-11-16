import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Night-flight palette: deep navy + afterburner orange
        space: "#040812",
        night: { DEFAULT: "#070E1C", 2: "#0C1629", 3: "#13213B", 4: "#1C2D4D" },
        line: "#1A2742",
        ink: { DEFAULT: "#F2F5FA", 2: "#B4BED0", 3: "#8390A8" },
        signal: { DEFAULT: "#FF6B2C", 2: "#FF8A4C", deep: "#E2470F" },
        sky: "#6FA8FF",
        mint: "#45E0A0",
        rose: "#FF5E6A",
        gold: "#FFC043",
      },
      fontFamily: {
        sans: ["'Heebo Variable'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono Variable'", "ui-monospace", "monospace"],
      },
      keyframes: {
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".3" } },
        drift: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        flap: { "0%": { transform: "rotateX(90deg)", opacity: "0" }, "100%": { transform: "rotateX(0)", opacity: "1" } },
      },
      animation: {
        blink: "blink 1.6s ease-in-out infinite",
        drift: "drift 90s linear infinite",
        flap: "flap .45s cubic-bezier(.2,.9,.3,1.2) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
