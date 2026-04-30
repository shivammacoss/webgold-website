/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B0B0C",
          surface: "#141416",
          fg: "#F5F1E8",
          gold: "#E5B547",
          "gold-soft": "#F4D38A",
        },
      },
    },
  },
  plugins: [],
};
