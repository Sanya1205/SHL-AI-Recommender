import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0818",
        "background-secondary": "#131027",
        sidebar: "#100D21",
        surface: "#1B1734",
        "surface-variant": "#241F44",
        primary: "#7C3AED",
        "primary-hover": "#B983FF",
        secondary: "#9D4EDD",
        "text-primary": "#F8F7FF",
        "text-secondary": "#B8B5D1",
        outline: "#403A5C",
        tertiary: "#e7c365",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 58, 237, 0.25)",
        "glow-sm": "0 0 20px rgba(124, 58, 237, 0.15)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [typography],
};
