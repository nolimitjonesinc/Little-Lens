import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: "#fef9f0",
          100: "#fef2e1",
          200: "#fce5c3",
          300: "#f9d7a5",
          400: "#f4ba69",
          500: "#f0a038",
          600: "#d88a2f",
          700: "#b87428",
          800: "#925f24",
          900: "#754c1e",
        },
        sage: {
          50: "#f6f8f6",
          100: "#eef0ed",
          200: "#dfe3db",
          300: "#cfd6ca",
          400: "#afc4a8",
          500: "#8fb186",
          600: "#7a9a71",
          700: "#65835b",
          800: "#526c4a",
          900: "#42563d",
        },
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
