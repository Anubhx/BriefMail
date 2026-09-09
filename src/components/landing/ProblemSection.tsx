"use client";

import { motion } from "framer-motion";

const PROBLEMS = [
  {
    num: "Context fragmentation",
    title: "The important thing is buried",
    body: "A ₹15,000 EMI due Friday sits under fourteen unread newsletters. Interview confirmations get lost between promo codes. Nothing about Gmail tells you what matters today.",
  },
  {
    num: "Manual re-entry",
    title: "You're the integration layer",
    body: "Copying expenses into a budget sheet. Pasting job links into Notion. Re-typing meeting URLs into your calendar. Your inbox already has this data — nobody's using it.",
  },
  {
    num: "Clutter as insurance",
    title: "You keep everything, just in case",
    body: "Thousands of promotional emails stay unarchived because one might contain an invoice you'll need in April. Search shouldn't require hoarding.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 md:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        {/* Section Head */}
        <div className="grid grid-cols-1 md:grid-cols-[0.42fr_0.58fr] gap-5 md:gap-16 mb-12 md:mb-[72px]">
          <div>
            <span className="font-mono text-[12.5px] text-[var(--text-3)]">
              01 — the problem
            </span>
          </div>
          <div>
            <h2
              data-reveal
              className="font-serif text-[clamp(28px,3.2vw,40px)] leading-[1.15] font-normal tracking-[-0.01em] text-[var(--text)]"
            >
              Three things are quietly broken about how you use email today.
            </h2>
          </div>
        </div>

        {/* 3-cell Grid */}
        <div
          data-reveal-group
          className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--border)] border border-[var(--border)] rounded-[12px] overflow-hidden"
        >
          {PROBLEMS.map((problem) => (
            <motion.div
              key={problem.num}
              data-reveal-item
              className="bg-[var(--surface)] p-8 md:p-9 transition-colors duration-200"
              whileHover={{ backgroundColor: "var(--surface-2)" }}
            >
              <div className="font-mono text-[12px] text-[var(--text-3)] mb-[18px]">
                {problem.num}
              </div>
              <h3 className="font-serif text-[21px] font-normal tracking-[-0.005em] text-[var(--text)] mb-3">
                {problem.title}
              </h3>
              <p className="text-[14.5px] leading-[1.65] text-[var(--text-2)]">
                {problem.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
