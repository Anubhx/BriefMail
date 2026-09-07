import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Mail, ArrowRight, ShieldCheck, Zap, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "BriefMail — Intelligent Email Copilot",
  description:
    "BriefMail automatically triages your Gmail inbox, extracts financial receipts, tracks job applications, and generates meeting digests — powered by AI.",
  alternates: {
    canonical: "https://briefmail.vercel.app/",
  },
};

// JSON-LD for the landing page
const pageJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BriefMail",
  url: "https://briefmail.vercel.app",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description:
    "AI-powered email copilot that automatically triages Gmail, extracts financial data, tracks job applications, and generates meeting digests.",
  featureList: [
    "Multi-tier AI inbox triage using Gemini language models",
    "Automated financial receipt and bank statement parsing",
    "Job application Kanban board synced from email",
    "Meeting digest generation with action items",
    "Real-time Gmail OAuth sync via Google Pub/Sub",
    "Enterprise-grade auth with Clerk and Supabase RLS",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col justify-between p-6">
      {/* Header Navigation */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <Logo variant="long" width={180} height={34} href="/" priority />

        {/* Auth Controls */}
        <nav aria-label="Main navigation" className="flex items-center gap-4">
          <a
            href="#features"
            className="hidden sm:inline-block text-sm font-ui text-text-secondary hover:text-text-primary px-3 py-2 transition-colors"
          >
            Features
          </a>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                id="sign-in-btn"
                className="text-sm font-ui text-text-secondary hover:text-text-primary px-3 py-2 transition-colors"
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                id="get-started-btn"
                className="text-sm font-ui bg-brand text-white hover:bg-brand-hover px-4 py-2 rounded-lg font-medium shadow-xs transition-colors"
              >
                Get Started
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/inbox">
              <Button variant="secondary" size="sm">
                Open Workspace <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </Link>
            <UserButton />
          </Show>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto w-full text-center flex flex-col items-center gap-6 py-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated text-brand border border-border-default text-xs font-mono shadow-2xs">
          <Zap className="w-3.5 h-3.5" aria-hidden="true" /> Intelligent Email Triage
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1] text-text-primary">
          Calm, Editorial Email Triage for{" "}
          <span className="text-brand">Power Users</span>
        </h1>

        <p className="font-sans text-lg text-text-secondary max-w-2xl leading-relaxed">
          BriefMail categorises your inbox, extracts financial receipts, tracks
          career opportunities, and prepares meeting digests — automatically.
        </p>

        <div className="flex items-center gap-4 mt-4">
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button id="hero-cta-btn" size="md" variant="primary">
                Start for Free <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/inbox">
              <Button id="go-to-inbox-btn" size="md" variant="primary">
                Go to Inbox <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>
          </Show>
        </div>

        {/* Feature Cards */}
        <section
          id="features"
          aria-label="Key features"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left"
        >
          <article className="p-6 rounded-xl bg-surface-elevated border border-border-default hover:border-border-strong transition-all shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface text-brand border border-border-default flex items-center justify-center mb-3">
              <Bot className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-1">
              Multi-Tier AI
            </h2>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Fast heuristic rules for instant triage paired with precision
              language models for deep extraction.
            </p>
          </article>

          <article className="p-6 rounded-xl bg-surface-elevated border border-border-default hover:border-border-strong transition-all shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface text-brand border border-border-default flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-1">
              Secure by Default
            </h2>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Enterprise-grade session management with Clerk SSR middleware and
              Supabase row-level security.
            </p>
          </article>

          <article className="p-6 rounded-xl bg-surface-elevated border border-border-default hover:border-border-strong transition-all shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface text-brand border border-border-default flex items-center justify-center mb-3">
              <Mail className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-1">
              Seamless Sync
            </h2>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Real-time Gmail OAuth sync and webhook triggers for immediate
              background email delivery and processing.
            </p>
          </article>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full py-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-text-muted">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <Logo variant="square" width={18} height={16} href="/" />
            <span className="font-medium text-text-primary">BriefMail</span>
          </div>
          <p>© 2026 BriefMail. Calm, intelligent email copilot.</p>
        </div>

        <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#features" className="hover:text-text-primary transition-colors">
            Features
          </a>
          <Link href="/sign-in" className="hover:text-text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="hover:text-text-primary transition-colors">
            Get Started
          </Link>
          <Link href="/privacy" className="hover:text-text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-text-primary transition-colors">
            Terms of Service
          </Link>
          <a
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors font-mono"
          >
            llms.txt
          </a>
        </nav>
      </footer>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
    </div>
  );
}
