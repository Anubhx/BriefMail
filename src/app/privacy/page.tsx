import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "BriefMail privacy policy - how we handle your Google account data, email metadata, and security.",
  alternates: {
    canonical: "https://briefmail.vercel.app/privacy",
  },
};

export default function PrivacyPage() {
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
          <span className="text-xs font-mono uppercase tracking-widest text-brand">Legal & Privacy</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Privacy Policy
          </h1>
          <p className="text-xs text-text-muted font-mono">Last updated: September 8, 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">1. Overview</h2>
          <p className="text-sm text-text-secondary">
            BriefMail (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the BriefMail application at{" "}
            <span className="font-mono text-xs text-text-primary">https://briefmail.vercel.app</span>. We respect
            your privacy and are committed to protecting the personal data of our users.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">2. Google API Data & Gmail Access</h2>
          <p className="text-sm text-text-secondary">
            BriefMail connects to your Gmail account via Google OAuth to provide automated email classification,
            financial receipt parsing, career application tracking, and meeting digests.
          </p>
          <ul className="list-disc pl-5 text-sm text-text-secondary space-y-1.5">
            <li>
              <strong>Data Minimization:</strong> We fetch only necessary message headers and metadata required for
              classification. Raw email message bodies are processed ephemerally and are not permanently stored on our servers.
            </li>
            <li>
              <strong>No Advertising:</strong> Your email data is never used to serve advertisements or sold to third-party data brokers.
            </li>
            <li>
              <strong>No Model Training:</strong> Your email contents are not used to train generalized AI models.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">3. Data Security & Storage</h2>
          <p className="text-sm text-text-secondary">
            We store application data and authentication state in Supabase and Clerk using industry-standard AES-256
            encryption at rest and TLS 1.3 in transit. Access to databases is protected by strict Row Level Security (RLS).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">4. Your Rights & Data Deletion</h2>
          <p className="text-sm text-text-secondary">
            You may revoke BriefMail&apos;s access to your Google account at any time via your Google Account Security
            settings or through the BriefMail Settings panel. You can also request complete account and data deletion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-text-primary">5. Contact</h2>
          <p className="text-sm text-text-secondary">
            If you have questions regarding this Privacy Policy, you may contact our team at{" "}
            <span className="font-mono text-xs text-brand">support@briefmail.vercel.app</span>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full py-6 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>© 2026 BriefMail. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
