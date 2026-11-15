import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
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
        surface: {
          DEFAULT: "#f8f9ff",
          dim: "#cbdbf6",
          bright: "#f8f9ff",
          low: "#eff4ff",
          container: "#e6eeff",
          high: "#dde9ff",
          highest: "#d3e3ff",
          card: "#ffffff",
        },
        primary: {
          DEFAULT: "#012d1d",
          foreground: "#ffffff",
          container: "#1b4332",
          hover: "#2d6a4f",
          fixed: "#c1ecd4",
          "fixed-dim": "#a5d0b9",
        },
        secondary: {
          DEFAULT: "#116c4a",
          foreground: "#ffffff",
          container: "#a1f4c8",
          emerald: "#40916c",
        },
        brand: {
          navy: "#0a369d",
          cobalt: "#0056b3",
          deep: "#0b3c5d",
          telemetry: "#0284c7",
          forest: "#1b4332",
        },
        status: {
          nominal: "#2e7d32",
          "nominal-bg": "#e8f5e9",
          warning: "#d97706",
          "warning-bg": "#fef3c7",
          critical: "#dc2626",
          "critical-bg": "#fee2e2",
          offline: "#64748b",
          "offline-bg": "#f1f5f9",
        },
        error: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
          container: "#ffdad6",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0b1c30",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(11, 28, 48, 0.05)",
        "card-hover": "0 4px 14px rgba(10, 54, 157, 0.08)",
        modal: "0 12px 32px rgba(11, 28, 48, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;

