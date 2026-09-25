/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        secondary: "#FB923C",
        cta: "#2563EB",
        background: "#FFF7ED",
        text: "#9A3412",
        "status-warning": "#F59E0B",
        "status-danger": "#EF4444",
        "status-success": "#22C55E",
      },
      fontFamily: {
        heading: ["Varela Round", "sans-serif"],
        body: ["Nunito Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
