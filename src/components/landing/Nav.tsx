"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { SplitButton } from "./SplitButton";

export function Nav() {
  return (
    <nav
      id="nav"
      className="fixed top-0 left-0 right-0 z-[100] py-5 md:py-[26px] bg-[rgba(245,243,238,0)] border-b border-transparent transition-[background,border-color,backdrop-filter] duration-300 [&.scrolled]:bg-[rgba(245,243,238,0.85)] [&.scrolled]:backdrop-blur-[10px] [&.scrolled]:border-[var(--border)]"
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-[20px] font-semibold tracking-[-0.01em] flex items-center gap-2 text-[var(--text)] group"
          data-hover
        >
          <span className="w-[9px] h-[9px] bg-[var(--brand)] rounded-[2px] shrink-0 group-hover:scale-110 transition-transform" />
          BriefMail
        </Link>

        {/* Center Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-9 text-[14px] text-[var(--text-2)]">
          <a
            href="#problem"
            data-hover
            className="relative py-1 hover:text-[var(--text)] transition-colors group"
          >
            The problem
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--text)] transition-all duration-300 ease-out group-hover:w-full" />
          </a>
          <a
            href="#pipeline"
            data-hover
            className="relative py-1 hover:text-[var(--text)] transition-colors group"
          >
            How it works
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--text)] transition-all duration-300 ease-out group-hover:w-full" />
          </a>
          <a
            href="#surfaces"
            data-hover
            className="relative py-1 hover:text-[var(--text)] transition-colors group"
          >
            Inside the app
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--text)] transition-all duration-300 ease-out group-hover:w-full" />
          </a>
          <a
            href="#philosophy"
            data-hover
            className="relative py-1 hover:text-[var(--text)] transition-colors group"
          >
            Philosophy
            <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-[var(--text)] transition-all duration-300 ease-out group-hover:w-full" />
          </a>
        </div>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <motion.button
                type="button"
                className="hidden sm:inline-flex text-[14px] text-[var(--text-2)] hover:text-[var(--text)] px-3 py-2 min-h-[44px] items-center transition-colors font-medium cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-hover
              >
                Sign In
              </motion.button>
            </SignInButton>

            <SignUpButton mode="modal">
              <SplitButton>
                Connect Gmail →
              </SplitButton>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/inbox">
              <motion.button
                type="button"
                className="font-ui text-[14px] font-medium px-4 py-2.5 rounded-[7px] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] inline-flex items-center gap-2 min-h-[44px] cursor-pointer hover:bg-[var(--surface-2)]"
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                data-hover
              >
                Open Workspace →
              </motion.button>
            </Link>
            <UserButton />
          </Show>
        </div>
      </div>
    </nav>
  );
}
