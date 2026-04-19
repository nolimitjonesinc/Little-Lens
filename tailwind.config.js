/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: "#f0a038",
          50: "#fef9ec",
          100: "#fdf3d9",
          200: "#fbe6b3",
          300: "#f9d98d",
          400: "#f7cc67",
          500: "#f0a038",
          600: "#d68a2a",
          700: "#bc741c",
          800: "#a25e0e",
          900: "#884800",
        },
        sage: {
          DEFAULT: "#8fb186",
          50: "#f4f7f3",
          100: "#e9efe7",
          200: "#d3dfcf",
          300: "#bdcfb7",
          400: "#a7c09f",
          500: "#8fb186",
          600: "#75976b",
          700: "#5b7d50",
          800: "#416335",
          900: "#27491a",
        },
        background: "#faf7f2",
        card: "#ffffff",
        border: "#e8e0d5",
      },
    },
  },
  plugins: [],
}

