/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        forest: "#12372A",
        leaf: "#2E7D32",
        sprout: "#8BC34A",
        canvas: "#F7F9F4",
        amber: "#F59E0B",
        danger: "#DC2626",
        signal: "#1F7A8C",
      },
      boxShadow: {
        soft: "0 12px 30px -18px rgba(18, 55, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
