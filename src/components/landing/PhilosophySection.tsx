"use client";

import { motion } from "framer-motion";

const PRINCIPLES = [
  {
    title: "Rules before models",
    body: "If a deterministic pattern can classify an email with full precision, BriefMail never spends a model call on it.",
  },
  {
    title: "Privacy by default",
    body: "Structured metadata and summaries live in Postgres with row-level security - not permanent copies of your full email bodies.",
  },
  {
    title: "Speed as a feature",
    body: "Heuristic triage runs in single-digit milliseconds, so the inbox never feels like it's \"thinking\" before showing you mail.",
  },
];

export function PhilosophySection() {
  return (
    <section id="philosophy" className="py-20 md:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-6 sm:p-9 md:p-16">
          {/* Top text block */}
          <div className="grid grid-cols-1 md:grid-cols-[0.45fr_0.55fr] gap-6 md:gap-12 mb-10 md:mb-14">
            <h2
              data-reveal
              className="font-serif text-[clamp(26px,3vw,34px)] font-normal leading-[1.2] text-[var(--text)]"
            >
              Built on a few strict rules, not vibes.
            </h2>
            <p
              data-reveal
              className="text-[15.5px] leading-[1.65] text-[var(--text-2)] self-end"
            >
              Most inbox tools bolt AI onto search. BriefMail was designed backwards
              from a simple standard: never guess when a rule will do, and never keep
              more of your data than the feature needs.
            </p>
          </div>

          {/* 3 Principles */}
          <div
            data-reveal-group
            className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--border)] border border-[var(--border)] rounded-[10px] overflow-hidden"
          >
            {PRINCIPLES.map((principle) => (
              <motion.div
                key={principle.title}
                data-reveal-item
                className="bg-[var(--surface)] p-[26px] md:p-7 transition-colors duration-200"
                whileHover={{ backgroundColor: "var(--surface-2)" }}
              >
                <h4 className="text-[14.5px] font-semibold text-[var(--text)] mb-2">
                  {principle.title}
                </h4>
                <p className="text-[13.5px] leading-[1.6] text-[var(--text-3)]">
                  {principle.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
