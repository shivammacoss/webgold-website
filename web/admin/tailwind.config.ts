import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B0B0C",
          surface: "#141416",
          fg: "#F5F1E8",
          "fg-dim": "#9A958A",
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
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
