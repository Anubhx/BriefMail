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
        surface: {
          canvas: "#F5F3EE",
          base: "#F5F3EE",
          DEFAULT: "#FFFFFF",
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
          investments: "#D58A00",
          social: "#D64F7A",
          newsletter: "#309BA8",
          otp: "#E46C2E",
          system: "#777A80",
        },
        semantic: {
          success: "#2FA66A",
          error: "#DC2626",
          warning: "#D58A00",
          info: "#4267D5",
        },
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
