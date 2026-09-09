import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "BriefMail — Your inbox, understood",
  description:
    "BriefMail reads every email that hits your Gmail and sorts it into the thing it actually is — a bank alert, an interview invite, a meeting link, a bill due Thursday. No more digging.",
  alternates: {
    canonical: "https://briefmail.vercel.app/",
  },
  openGraph: {
    title: "BriefMail — Your inbox, understood",
    description:
      "BriefMail reads every email that hits your Gmail and sorts it into the thing it actually is — a bank alert, an interview invite, a meeting link, a bill due Thursday.",
    url: "https://briefmail.vercel.app",
    siteName: "BriefMail",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BriefMail — Your inbox, understood",
    description:
      "BriefMail reads every email that hits your Gmail and sorts it into the thing it actually is.",
  },
};

// JSON-LD structured data for the landing page
const pageJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BriefMail",
  url: "https://briefmail.vercel.app",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description:
    "BriefMail reads every email that hits your Gmail and sorts it into the thing it actually is — a bank alert, an interview invite, a meeting link, a bill due Thursday.",
  featureList: [
    "Deterministic regex rules for single-digit millisecond classification",
    "Lightweight classifier for ambiguous emails",
    "Gemini 2.5 Flash Lite structured JSON extraction",
    "Four focused surfaces: Finance, Career, Meetings, System/OTP alerts",
    "Read-only Gmail OAuth with Supabase Row-Level Security",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
