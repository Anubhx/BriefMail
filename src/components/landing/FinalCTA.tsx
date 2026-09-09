"use client";

import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { motion } from "framer-motion";

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
            — nothing to configure, nothing to migrate.
          </p>

          <div
            data-reveal
            className="flex flex-wrap items-center gap-[22px] mt-9"
          >
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <motion.button
                  type="button"
                  className="font-ui text-[14px] font-medium px-5 py-2.5 rounded-[7px] bg-[var(--brand)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] inline-flex items-center gap-2 min-h-[44px] cursor-pointer hover:bg-[var(--brand-hover)]"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  data-hover
                >
                  Connect your Gmail →
                </motion.button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <Link href="/inbox">
                <motion.button
                  type="button"
                  className="font-ui text-[14px] font-medium px-5 py-2.5 rounded-[7px] bg-[var(--brand)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] inline-flex items-center gap-2 min-h-[44px] cursor-pointer hover:bg-[var(--brand-hover)]"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                  data-hover
                >
                  Open Workspace →
                </motion.button>
              </Link>
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
