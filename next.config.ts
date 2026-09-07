import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Production build hardening ──────────────────────────────────────────
  productionBrowserSourceMaps: false, // No .map files shipped to users
  compress: true,                     // Enable gzip compression
  poweredByHeader: false,             // Remove X-Powered-By: Next.js header

  // ── Image optimisation ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },

  // ── Server Actions ────────────────────────────────────────────────────────
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // ── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
