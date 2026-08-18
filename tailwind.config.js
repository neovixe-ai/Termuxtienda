/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        foreground: "rgb(var(--c-fg) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--c-primary) / <alpha-value>)",
          hover: "rgb(var(--c-primary-hover) / <alpha-value>)",
          soft: "rgb(var(--c-primary-soft) / <alpha-value>)",
        },
        success: "rgb(var(--c-success) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)",
        whatsapp: "rgb(var(--c-whatsapp) / <alpha-value>)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px -4px rgba(0,0,0,0.08)",
        card: "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -8px rgba(0,0,0,0.12)",
        pop: "0 4px 12px -2px rgba(0,0,0,0.12), 0 16px 40px -12px rgba(0,0,0,0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
