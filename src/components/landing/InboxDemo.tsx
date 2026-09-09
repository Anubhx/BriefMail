"use client";

import { motion } from "framer-motion";

interface DemoEmail {
  initials: string;
  sender: string;
  subject: string;
  tag: string;
  tagClass: string;
}

const DEMO_EMAILS: DemoEmail[] = [
  {
    initials: "HD",
    sender: "HDFC Bank",
    subject: "₹4,200 debited via UPI to Zomato",
    tag: "finance",
    tagClass: "bg-[#DCFCE7] text-[#16803C]",
  },
  {
    initials: "LI",
    sender: "LinkedIn Recruiter",
    subject: "Interview scheduled — Senior Frontend, Thu 3pm",
    tag: "career",
    tagClass: "bg-[#E0E7FF] text-[#4338CA]",
  },
  {
    initials: "GM",
    sender: "Google Meet",
    subject: "Design sync in 15 minutes",
    tag: "meetings",
    tagClass: "bg-[#EDE4FB] text-[#6D28D9]",
  },
  {
    initials: "AX",
    sender: "Axis Bank",
    subject: "Your OTP is 482913 — valid for 5 min",
    tag: "otp",
    tagClass: "bg-[#FEF3E7] text-[#C2570F]",
  },
];

export function InboxDemo() {
  return (
    <div
      data-reveal-hero
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] shadow-[0_8px_24px_-3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden w-full"
    >
      {/* Browser chrome header */}
      <div className="px-[18px] py-[14px] border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]">
        <span className="font-mono text-[11.5px] text-[var(--text-3)] tracking-tight">
          inbox.briefmail.app
        </span>
        <div className="flex items-center gap-[6px]">
          <i className="w-2 h-2 rounded-full bg-[var(--border-strong)] block not-italic" />
          <i className="w-2 h-2 rounded-full bg-[var(--border-strong)] block not-italic" />
          <i className="w-2 h-2 rounded-full bg-[var(--border-strong)] block not-italic" />
        </div>
      </div>

      {/* Email Rows */}
      <div className="divide-y divide-[var(--border)]">
        {DEMO_EMAILS.map((item, index) => (
          <motion.div
            key={item.sender}
            data-demo-row
            className="flex items-center gap-[14px] px-[18px] py-4 relative transition-colors duration-200"
            whileHover={{ backgroundColor: "var(--surface-2)" }}
            data-hover
          >
            <div className="w-[34px] h-[34px] rounded-full bg-[var(--surface-3)] shrink-0 flex items-center justify-center font-mono text-[11px] text-[var(--text-3)] select-none">
              {item.initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-medium text-[var(--text)] leading-tight">
                {item.sender}
              </div>
              <div className="text-[13px] text-[var(--text-3)] truncate mt-[2px] leading-tight">
                {item.subject}
              </div>
            </div>

            <div
              data-demo-tag
              className={`font-mono text-[10.5px] px-2 py-1 rounded-[5px] whitespace-nowrap opacity-0 translate-x-[6px] font-medium ${item.tagClass}`}
            >
              {item.tag}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
