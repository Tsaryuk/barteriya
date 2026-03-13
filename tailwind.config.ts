import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          DEFAULT: "#FEFBF4",
          50: "#FFFDF9",
          100: "#FEFBF4",
          200: "#F8F1E0",
          300: "#EDE4CC",
        },
        warm: {
          50: "#FAF9F7",
          100: "#F5F0E8",
          200: "#E8E2D6",
          300: "#D4CCBD",
          400: "#B5AB98",
          500: "#8E8A80",
          600: "#6B665C",
          700: "#4A4640",
          800: "#2D2A24",
          900: "#1F1B13",
        },
        brand: {
          amber: "#E8960C",
          "amber-light": "#FFF4DE",
          "amber-dark": "#B8730A",
          gold: "#F5C842",
          sage: "#4DAA6D",
          "sage-light": "#E8F5EE",
          coral: "#E8614D",
          "coral-light": "#FFF0EC",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 40px rgba(232, 150, 12, 0.15)",
        "card": "0 1px 3px rgba(45, 42, 36, 0.04), 0 4px 12px rgba(45, 42, 36, 0.03)",
        "card-hover": "0 2px 8px rgba(45, 42, 36, 0.06), 0 8px 24px rgba(45, 42, 36, 0.06)",
        "warm": "0 4px 20px rgba(232, 150, 12, 0.1)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-warm": "pulse-warm 2s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out",
        "slide-up-delayed": "slide-up 0.6s ease-out 0.15s both",
        "slide-up-delayed-2": "slide-up 0.6s ease-out 0.3s both",
        "fade-in": "fade-in 0.5s ease-out",
        "count-up": "count-up 2s ease-out",
        "spin-slow": "spin 8s linear infinite",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-warm": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "count-up": {
          from: { opacity: "0", transform: "scale(0.8)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
