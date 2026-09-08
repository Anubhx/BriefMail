import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF5A2A",
          hover: "#E94D21",
          pressed: "#CF421C",
          subtle: "rgba(255, 90, 42, 0.08)",
          muted: "rgba(255, 90, 42, 0.15)",
        },
        background: {
          DEFAULT: "#FFFFFF",
        },
        surface: {
          canvas: "#F5F3EE",
          base: "#F5F3EE",
          DEFAULT: "#FFFFFF",
          primary: "#FFFFFF",
          secondary: "#F8F7F4",
          elevated: "#F8F7F4",
          subtle: "#F1F0EC",
          overlay: "#FFFFFF",
        },
        border: {
          subtle: "#E4E1DA",
          DEFAULT: "#E4E1DA",
          strong: "#D6D1C8",
        },
        text: {
          primary: "#171717",
          secondary: "#4A4A45",
          muted: "#77766F",
          disabled: "#A2A098",
        },
        cat: {
          finance: "#2FA66A",
          career: "#4267D5",
          meetings: "#8B5CC7",
          investments: "#0D9488",
          social: "#0EA5E9",
          newsletter: "#8B5CF6",
          otp: "#E46C2E",
          system: "#777A80",
        },
        "category-investments": "#0D9488",
        "category-social": "#0EA5E9",
        "category-finance": "#2FA66A",
        "category-career": "#4267D5",
        "category-jobs": "#4267D5",
        "category-meetings": "#8B5CC7",
        "category-newsletter": "#8B5CF6",
        "category-otp": "#E46C2E",
        "category-system": "#777A80",
        "category-ads": "#E11D48",
        semantic: {
          success: "#2FA66A",
          error: "#DC2626",
          warning: "#D58A00",
          info: "#4267D5",
        },
        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",
        "success-muted": "hsl(var(--success-muted))",
        warning: "hsl(var(--warning))",
        "warning-foreground": "hsl(var(--warning-foreground))",
        "warning-muted": "hsl(var(--warning-muted))",
        danger: "hsl(var(--danger))",
        "danger-foreground": "hsl(var(--danger-foreground))",
        "danger-muted": "hsl(var(--danger-muted))",
      },
      fontFamily: {
        ui: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "elevation-1": "0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.03)",
        "elevation-2": "0 2px 8px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        "elevation-3": "0 8px 24px -3px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
