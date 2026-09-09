"use client";

import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { SplitButton } from "./SplitButton";

export function FinalCTA() {
  return (
    <section id="cta" className="pt-20 md:pt-[140px] pb-16 md:pb-[100px] text-left">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="max-w-[680px]">
          <h2
            data-reveal
            className="font-serif text-[clamp(32px,4.6vw,52px)] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--text)]"
          >
            Stop reading your inbox like a list.
          </h2>

          <p
            data-reveal
            className="text-[16px] leading-[1.6] text-[var(--text-2)] mt-5 max-w-[44ch]"
          >
            Connect Gmail in under a minute. BriefMail starts classifying immediately
            - nothing to configure, nothing to migrate.
          </p>

          <div
            data-reveal
            className="flex flex-wrap items-center gap-[22px] mt-9"
          >
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <SplitButton>
                  Connect your Gmail →
                </SplitButton>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <SplitButton href="/inbox">
                Open Workspace →
              </SplitButton>
            </Show>

            <motion.a
              href="#pipeline"
              className="text-[14px] text-[var(--text-2)] border-b border-[var(--border-strong)] pb-[2px] transition-colors hover:text-[var(--text)] hover:border-[var(--text)] inline-flex items-center min-h-[44px]"
              whileHover={{ x: 2 }}
              data-hover
            >
              Read the architecture
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
