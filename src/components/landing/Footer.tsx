"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-10 bg-[var(--canvas)]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[var(--text-3)] text-center sm:text-left">
        <div className="flex items-center gap-4">
          <span>© 2026 BriefMail</span>
          <span className="hidden sm:inline text-[var(--border-strong)]">·</span>
          <span className="hidden sm:inline">Built on Next.js, Supabase & Gemini</span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="hover:text-[var(--text)] transition-colors min-h-[44px] inline-flex items-center"
            data-hover
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[var(--text)] transition-colors min-h-[44px] inline-flex items-center"
            data-hover
          >
            Terms
          </Link>
          <a
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--text)] transition-colors font-mono min-h-[44px] inline-flex items-center"
            data-hover
          >
            llms.txt
          </a>
        </div>
      </div>
    </footer>
  );
}
