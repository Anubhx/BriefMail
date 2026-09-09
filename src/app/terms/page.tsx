import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "BriefMail terms of service - user responsibilities, service availability, and terms of use.",
  alternates: {
    canonical: "https://briefmail.vercel.app/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col p-6 font-ui">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full py-4 flex items-center justify-between border-b border-border">
        <Logo variant="long" width={160} height={30} href="/" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to Home
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto w-full py-12 flex-1 space-y-8 leading-relaxed">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-brand">Legal & Terms</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Terms of Service
          </h1>
          <p className="text-xs text-text-muted font-mono">Last updated: September 8, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">1. Acceptance of Terms</h2>
          <p className="text-sm text-text-secondary">
            By creating an account or accessing BriefMail at{" "}
            <span className="font-mono text-xs text-text-primary">https://briefmail.vercel.app</span>, you agree to
            be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">2. Service Description</h2>
          <p className="text-sm text-text-secondary">
            BriefMail provides automated inbox classification, extraction of financial receipts and bank statements,
            career opportunity management, and meeting digest generation. The service is provided &quot;as is&quot;
            and may be updated from time to time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">3. User Responsibilities</h2>
          <p className="text-sm text-text-secondary">
            You are responsible for maintaining the confidentiality of your credentials and for all activities that
            occur under your account. You agree not to abuse, disrupt, or reverse-engineer the service or automated APIs.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">4. Limitation of Liability</h2>
          <p className="text-sm text-text-secondary">
            BriefMail will not be liable for any indirect, incidental, or consequential damages resulting from your use
            or inability to use the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">5. Governing Law</h2>
          <p className="text-sm text-text-secondary">
            These terms are governed by and construed in accordance with applicable laws, without regard to conflict of
            law principles.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full py-6 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>© 2026 BriefMail. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
