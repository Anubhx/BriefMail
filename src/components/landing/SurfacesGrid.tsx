"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Surface {
  key: string;
  title: string;
  desc: string;
  accent: string;
  accentBg: string;
  exampleLabel: string;
  exampleValue: string;
  icon: React.ReactNode;
}

const SURFACES: Surface[] = [
  {
    key: "finance",
    title: "Finance & investments",
    desc: "UPI debits, credit card bills, SIP confirmations, and Demat statements - pulled from raw receipts into running totals and upcoming EMIs, automatically.",
    accent: "var(--emerald)",
    accentBg: "rgba(47, 166, 106, 0.12)",
    exampleLabel: "next EMI",
    exampleValue: "₹12,400 · Fri",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--emerald)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    key: "career",
    title: "Career pipeline",
    desc: "Recruiter outreach, application confirmations, assessment links, and offer letters - parsed straight into a drag-and-drop Kanban you don't have to build yourself.",
    accent: "var(--indigo)",
    accentBg: "rgba(66, 103, 213, 0.12)",
    exampleLabel: "active threads",
    exampleValue: "7 in progress",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--indigo)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <rect x="3" y="4" width="7" height="16" rx="1" />
        <rect x="14" y="4" width="7" height="10" rx="1" />
      </svg>
    ),
  },
  {
    key: "meetings",
    title: "Meetings & calendar",
    desc: "Google Meet, Zoom, and Teams invites unified into one schedule, with a next-up hero card and one-click join - no hunting through threads for the link.",
    accent: "var(--purple)",
    accentBg: "rgba(139, 92, 199, 0.12)",
    exampleLabel: "next up",
    exampleValue: "Design sync · 15m",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--purple)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    key: "system",
    title: "Action blocks & triage",
    desc: "OTPs surface with one-tap copy and a countdown. Bill deadlines get flagged before they're due. Digests and platform alerts get bundled away from your primary view.",
    accent: "var(--amber)",
    accentBg: "rgba(228, 108, 46, 0.12)",
    exampleLabel: "OTP expires",
    exampleValue: "4:52",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M12 2l2.4 6.6L21 9l-5.4 4.5L17 21l-5-3.6L7 21l1.4-7.5L3 9l6.6-.4L12 2z" />
      </svg>
    ),
  },
];

export function SurfacesGrid() {
  const [secondsLeft, setSecondsLeft] = useState(292);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 292));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <section id="surfaces" className="py-20 md:py-[120px]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        {/* Section Head */}
        <div className="grid grid-cols-1 md:grid-cols-[0.42fr_0.58fr] gap-5 md:gap-16 mb-12 md:mb-[72px]">
          <div>
            <span className="font-mono text-[12.5px] text-[var(--text-3)]">
              03 — inside the app
            </span>
          </div>
          <div>
            <h2
              data-reveal
              className="font-serif text-[clamp(28px,3.2vw,40px)] leading-[1.15] font-normal tracking-[-0.01em] text-[var(--text)]"
            >
              Four surfaces, one inbox.
            </h2>
            <p
              data-reveal
              className="text-[16px] leading-[1.65] text-[var(--text-2)] max-w-[52ch] mt-4"
            >
              Once mail is classified, it stops being a list and becomes structured objects
              that live in the part of the app built for them.
            </p>
          </div>
        </div>

        {/* Surface Cards Grid */}
        <div
          data-reveal-group
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {SURFACES.map((surface) => (
            <div
              key={surface.key}
              data-reveal-item
              data-hover
              className="surface-card bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:shadow-[0_8px_24px_-3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] hover:-translate-y-[3px] transition-all duration-300 ease-out"
            >
              {/* Top Accent bar animated on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-350 ease-out group-hover:scale-x-100"
                style={{ backgroundColor: surface.accent }}
              />

              {/* Icon */}
              <div
                className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center mb-[22px]"
                style={{ backgroundColor: surface.accentBg }}
              >
                {surface.icon}
              </div>

              {/* Heading & description */}
              <h3 className="font-serif text-[20px] font-normal text-[var(--text)] mb-2.5">
                {surface.title}
              </h3>
              <p className="text-[14.5px] leading-[1.6] text-[var(--text-2)] mb-5">
                {surface.desc}
              </p>

              {/* Example row */}
              <div className="font-mono text-[12px] text-[var(--text-3)] pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span>{surface.exampleLabel}</span>
                <b className="text-[var(--text-2)] font-medium tabular-nums">
                  {surface.key === "system" ? formatTime(secondsLeft) : surface.exampleValue}
                </b>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
