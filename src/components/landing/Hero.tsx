"use client";

import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { InboxDemo } from "./InboxDemo";
import { SplitButton } from "./SplitButton";

export function Hero() {
  return (
    <header className="pt-[140px] md:pt-[180px] pb-20 md:pb-[120px] relative">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-14 lg:gap-16 items-center">
          {/* Left Hero Narrative */}
          <div>
            {/* Eyebrow */}
            <div className="font-mono text-[12.5px] text-[var(--text-3)] flex items-center gap-2.5 mb-[22px]">
              <span className="w-1.5 h-1.5 bg-[var(--emerald)] rounded-full shadow-[0_0_0_3px_rgba(47,166,106,0.15)] inline-block animate-pulse" />
              Reads your inbox in under 5ms, most of the time
            </div>

            {/* H1 Heading */}
            <h1
              data-reveal-hero
              className="font-serif text-[clamp(38px,4.6vw,60px)] leading-[1.06] font-normal tracking-[-0.01em] text-[var(--text)] max-w-[15ch]"
            >
              Your inbox isn&apos;t a list.
              <br />
              It&apos;s <em className="italic text-[var(--brand)] font-normal">five different jobs</em>
              <br />
              pretending to be one.
            </h1>

            {/* Subtext */}
            <p
              data-reveal-hero
              className="font-sans text-[17px] leading-[1.6] text-[var(--text-2)] max-w-[46ch] mt-6"
            >
              BriefMail reads every email that hits your Gmail and sorts it into the thing
              it actually is - a bank alert, an interview invite, a meeting link, a bill
              due Thursday. No more digging.
            </p>

            {/* CTAs */}
            <div data-reveal-hero className="flex flex-wrap items-center gap-[22px] mt-9">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <SplitButton>
                    Connect your Gmail →
                  </SplitButton>
                </SignUpButton>
              </Show>

              <Show when="signed-in">
                <SplitButton href="/inbox">
                  Go to Inbox →
                </SplitButton>
              </Show>

              <motion.a
                href="#pipeline"
                className="text-[14px] text-[var(--text-2)] border-b border-[var(--border-strong)] pb-[2px] transition-colors hover:text-[var(--text)] hover:border-[var(--text)] inline-flex items-center min-h-[44px]"
                whileHover={{ x: 2 }}
                data-hover
              >
                See how classification works
              </motion.a>
            </div>

            {/* Security note */}
            <div
              data-reveal-hero
              className="mt-11 font-mono text-[12.5px] text-[var(--text-3)]"
            >
              read-only by default · revoke access anytime · built on Supabase RLS
            </div>
          </div>

          {/* Right Visual: Inbox Demo */}
          <div className="w-full">
            <InboxDemo />
          </div>
        </div>
      </div>
    </header>
  );
}
