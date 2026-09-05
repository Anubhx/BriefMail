import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF6B00",
          hover: "#FF8933",
          subtle: "rgba(255, 107, 0, 0.12)",
          glow: "rgba(255, 107, 0, 0.35)",
        },
        surface: {
          base: "#0B1120",
          DEFAULT: "#0F172A",
          elevated: "#1E293B",
          overlay: "#334155",
        },
        border: {
          subtle: "rgba(248, 250, 252, 0.08)",
          strong: "rgba(248, 250, 252, 0.16)",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#CBD5E1",
          muted: "#94A3B8",
          disabled: "#475569",
        },
        semantic: {
          success: "#10B981",
          error: "#EF4444",
          warning: "#F59E0B",
          info: "#38BDF8",
        },
      },
      fontFamily: {
        ui: ["var(--font-plus-jakarta)", "sans-serif"],
        body: ["var(--font-satoshi)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "elevation-1": "0 1px 2px 0 rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(248, 250, 252, 0.05)",
        "elevation-2": "0 4px 12px -2px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(248, 250, 252, 0.08)",
        "elevation-3": "0 12px 32px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(248, 250, 252, 0.12)",
        "brand-glow": "0 0 20px -2px rgba(255, 107, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
