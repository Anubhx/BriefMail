"use client";

import { motion } from "framer-motion";
import { OdometerText } from "./OdometerText";

const TIERS = [
  {
    label: "TIER 1",
    title: "Deterministic rules",
    body: "Known bank domains, OTP subject patterns, recruitment portals like LinkedIn and Naukri - matched by regex before any model is even loaded. If the rule fires, that's the answer.",
    stat: "<5ms",
    statLabel: "resolves ~70% of mail",
  },
  {
    label: "TIER 2",
    title: "Lightweight classifier",
    body: "Emails Tier 1 can't confidently place get a fast zero-shot pass against a fixed category ontology - still no full LLM call, still fast enough to feel instant.",
    stat: "~200ms",
    statLabel: "handles the ambiguous middle",
  },
  {
    label: "TIER 3",
    title: "Gemini 3.5 Flash Lite",
    body: "Only genuinely unclear mail reaches an LLM - and even then it returns structured JSON: summary, amounts, due dates, meeting links. Nothing is left as an unstructured guess.",
    stat: "~1s",
    statLabel: "last resort, not first pass",
  },
];

export function PipelineSection() {
  return (
    <section id="pipeline" className="py-20 md:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        {/* Section Head */}
        <div className="grid grid-cols-1 md:grid-cols-[0.42fr_0.58fr] gap-5 md:gap-16 mb-12 md:mb-[72px]">
          <div>
            <span className="font-mono text-[12.5px] text-[var(--text-3)]">
              02 - how it works
            </span>
          </div>
          <div>
            <h2
              data-reveal
              className="font-serif text-[clamp(28px,3.2vw,40px)] leading-[1.15] font-normal tracking-[-0.01em] text-[var(--text)]"
            >
              A cascade, not a single model.
            </h2>
            <p
              data-reveal
              className="text-[16px] leading-[1.65] text-[var(--text-2)] max-w-[52ch] mt-4"
            >
              Every email is expensive to run through an LLM and slow to wait on.
              BriefMail only escalates when it has to - most mail never reaches Tier 3
              at all.
            </p>
          </div>
        </div>

        {/* Pipeline Tiers */}
        <div data-reveal-group className="flex flex-col border-t border-[var(--border)]">
          {TIERS.map((tier) => (
            <motion.div
              key={tier.label}
              data-reveal-item
              className="tier grid grid-cols-1 md:grid-cols-[120px_1fr_200px] gap-3 md:gap-8 py-8 md:py-10 border-b border-[var(--border)] items-start relative group transition-colors"
            >
              <div className="font-mono text-[12.5px] text-[var(--text-3)] pt-1">
                {tier.label}
              </div>

              <div className="tier-main">
                <h3 className="font-serif text-[23px] font-normal text-[var(--text)] mb-2.5">
                  {tier.title}
                </h3>
                <p className="text-[15px] leading-[1.65] text-[var(--text-2)] max-w-[50ch]">
                  {tier.body}
                </p>
              </div>

              <div className="tier-stat text-left md:text-right pt-1">
                <OdometerText
                  value={tier.stat}
                  className="font-mono text-[26px] text-[var(--text)] block leading-none font-medium"
                />
                <span className="text-[12px] text-[var(--text-3)] mt-1 block">
                  {tier.statLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
