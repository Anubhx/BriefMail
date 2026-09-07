import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Mail, ArrowRight, ShieldCheck, Zap, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col justify-between p-6">
      {/* Header Navigation */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center font-bold text-white shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-text-primary">
            Brief<span className="text-brand">Mail</span>
          </span>
        </div>

        {/* Clerk Auth Controls */}
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm font-ui text-text-secondary hover:text-text-primary px-3 py-2 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-ui bg-brand text-white hover:bg-brand-hover px-4 py-2 rounded-lg font-medium shadow-xs transition-colors">
                Get Started
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/inbox">
              <Button variant="secondary" size="sm">
                Open Workspace <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <UserButton />
          </Show>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto w-full text-center flex flex-col items-center gap-6 py-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated text-brand border border-border-default text-xs font-mono shadow-2xs">
          <Zap className="w-3.5 h-3.5" /> Intelligent Email Triage
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1] text-text-primary">
          Calm, Editorial Email Triage for <span className="text-brand">Power Users</span>
        </h1>

        <p className="font-sans text-lg text-text-secondary max-w-2xl leading-relaxed">
          BriefMail categorizes, extracts financial receipts, tracks career opportunities, and prepares meeting digests automatically.
        </p>

        <div className="flex items-center gap-4 mt-4">
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <Button size="md" variant="primary">
                Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/inbox">
              <Button size="md" variant="primary">
                Go to Inbox <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Show>
        </div>

        {/* Feature Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 text-left">
          <div className="p-6 rounded-xl bg-surface-elevated border border-border-default hover:border-border-strong transition-all shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface text-brand border border-border-default flex items-center justify-center mb-3">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary mb-1">Multi-Tier AI</h3>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Fast heuristic rules for instant triage paired with precision language models for deep extraction.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-elevated border border-border-default hover:border-border-strong transition-all shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface text-brand border border-border-default flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary mb-1">Secure Auth</h3>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Enterprise-grade session management with Clerk SSR middleware and Supabase row-level security.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-elevated border border-border-default hover:border-border-strong transition-all shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface text-brand border border-border-default flex items-center justify-center mb-3">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary mb-1">Seamless Ingestion</h3>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Real-time Gmail OAuth sync and n8n webhook triggers for immediate background email delivery.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full py-6 border-t border-border-default flex items-center justify-between text-xs text-text-muted">
        <span>© 2026 BriefMail Inc. All rights reserved.</span>
        <span>Built with Next.js 15 & Clerk Auth</span>
      </footer>
    </div>
  );
}
