import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const BASE_URL = "https://briefmail.vercel.app";

export const viewport: Viewport = {
  themeColor: "#FF5A2A",
};

export const metadata: Metadata = {
  // ── Title template ────────────────────────────────────────────────────────
  title: {
    default: "BriefMail — Intelligent Email Copilot",
    template: "%s | BriefMail",
  },

  // ── Description ───────────────────────────────────────────────────────────
  description:
    "BriefMail automatically triages your Gmail inbox, extracts financial receipts, tracks job applications, and generates meeting digests — powered by AI.",

  // ── Canonical URL ─────────────────────────────────────────────────────────
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "BriefMail",
    title: "BriefMail — Intelligent Email Copilot",
    description:
      "Automated inbox triage, finance tracking, career pipeline, and meeting digests powered by AI.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BriefMail — Calm, Editorial Email Triage for Power Users",
      },
    ],
  },

  // ── Twitter / X card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "BriefMail — Intelligent Email Copilot",
    description:
      "Automated inbox triage, finance tracking, career pipeline, and meeting digests powered by AI.",
    images: ["/og-image.jpg"],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logos/logo-square.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/logos/logo-square.png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },

  // ── Web manifest ─────────────────────────────────────────────────────────
  manifest: "/site.webmanifest",

  // ── Robots (public pages indexable) ──────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── App-specific ─────────────────────────────────────────────────────────
  applicationName: "BriefMail",
  generator: undefined, // do not expose generator
  category: "productivity",
  keywords: [
    "email management",
    "AI email",
    "inbox triage",
    "email copilot",
    "Gmail automation",
    "finance tracker",
    "career pipeline",
    "meeting digests",
  ],
};

// ── JSON-LD structured data ──────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#webapp`,
      name: "BriefMail",
      url: BASE_URL,
      description:
        "AI-powered email copilot that automatically triages Gmail, extracts financial data, tracks job applications, and generates meeting digests.",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript. Requires a modern browser.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#org`,
      name: "BriefMail",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logos/logo-square.png`,
        width: 192,
        height: 192,
      },
      sameAs: ["https://briefmail.vercel.app"],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${BASE_URL}/#localbusiness`,
      name: "BriefMail",
      url: BASE_URL,
      logo: `${BASE_URL}/logos/logo-square.png`,
      image: `${BASE_URL}/og-image.jpg`,
      description:
        "AI-powered email copilot providing automated Gmail triage, financial extraction, career management, and meeting digests.",
      telephone: "+1-800-555-0199",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "100 Pine Street",
        addressLocality: "San Francisco",
        addressRegion: "CA",
        postalCode: "94111",
        addressCountry: "US",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-surface-canvas text-text-primary font-ui selection:bg-brand/10 selection:text-brand">
        <ClerkProvider>
          <Providers>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
