import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Slightly warmer near-black, like Robinhood Gold's bg
          bg: "#0B0B0C",
          // Subtle layer above bg for cards/panels
          surface: "#141416",
          // Ivory text — warmer than pure white, easier on the eyes
          fg: "#F5F1E8",
          "fg-dim": "#9A958A",
          // Robinhood-style premium gold (warmer than #D4AF37)
          gold: "#E5B547",
          "gold-soft": "#F4D38A",
        },
        primary: "#F5F1E8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        "tight-display": "-0.035em",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 400ms ease-out both",
        "fade-up": "fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
