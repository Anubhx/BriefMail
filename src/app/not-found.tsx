import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight, Home, Inbox } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full py-4">
        <Logo variant="long" width={160} height={30} href="/" />
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full gap-6 pb-20">
        {/* Editorial number */}
        <div className="font-serif text-[120px] sm:text-[160px] font-bold leading-none text-border-strong select-none">
          404
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight">
            This page doesn&apos;t exist
          </h1>
          <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
            The page you&apos;re looking for may have been moved, renamed, or
            never existed. Let&apos;s get you back on track.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go to Homepage
          </Link>
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-elevated border border-border-default text-sm font-medium text-text-primary hover:border-border-strong transition-colors shadow-xs"
          >
            <Inbox className="w-4 h-4" aria-hidden="true" />
            Open Inbox
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full py-4 border-t border-border text-xs text-text-muted text-center">
        © 2026 BriefMail. All rights reserved.
      </footer>
    </div>
  );
}
