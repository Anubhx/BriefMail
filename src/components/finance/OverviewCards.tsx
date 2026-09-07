"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, CalendarClock, PieChart, Receipt } from "lucide-react";
import { clsx } from "clsx";

export interface OverviewData {
  has_data?: boolean;
  total_debits?: number;
  total_credits?: number;
  total_debits_this_month?: number;
  total_credits_this_month?: number;
  next_emi?: {
    lender?: string;
    amount?: number;
    due_date?: string;
    days_left?: number;
  } | null;
  active_sips_total?: number;
}

interface OverviewCardsProps {
  data?: OverviewData | null;
  isLoading?: boolean;
}

const formatCurrency = (val?: number | null) => {
  const safeVal = typeof val === "number" && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeVal);
};

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full select-none font-ui">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-surface border border-border-default animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded bg-surface-subtle" />
            <div className="flex flex-col gap-2">
              <div className="w-24 h-3 bg-surface-subtle rounded" />
              <div className="w-32 h-5 bg-surface-subtle rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Clean empty state when data is not available or has_data is false
  if (!data || data.has_data === false) {
    return (
      <div className="p-8 text-center border border-dashed border-border-default rounded-lg text-text-muted text-sm font-ui bg-surface-secondary flex flex-col items-center justify-center gap-2">
        <Receipt className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-primary">No data yet</p>
        <p className="text-xs text-text-muted">Monthly debits, credits, upcoming EMI, and SIP totals will appear here.</p>
      </div>
    );
  }

  const totalDebits = (data?.total_debits ?? data?.total_debits_this_month ?? 0);
  const totalCredits = (data?.total_credits ?? data?.total_credits_this_month ?? 0);
  const activeSips = (data?.active_sips_total ?? 0);
  const nextEmiAmount = (data?.next_emi?.amount ?? 0);
  const nextEmiLender = data?.next_emi?.lender ?? "EMI";
  const nextEmiDueDate = data?.next_emi?.due_date ? String(data.next_emi.due_date) : "";
  const nextEmiDaysLeft = data?.next_emi?.days_left ?? 0;

  const cards = [
    {
      id: "debits",
      title: "Debits (This Month)",
      value: formatCurrency(totalDebits ?? 0),
      subtitle: (totalDebits ?? 0) > 0 ? "Bank & UPI transactions" : "No debits this month",
      icon: TrendingDown,
      color: "text-[#CF421C]",
      bgColor: "bg-[#CF421C]/10 border-[#CF421C]/20",
    },
    {
      id: "credits",
      title: "Credits (This Month)",
      value: formatCurrency(totalCredits ?? 0),
      subtitle: (totalCredits ?? 0) > 0 ? "Salary & incoming credits" : "No credits this month",
      icon: TrendingUp,
      color: "text-[#2FA66A]",
      bgColor: "bg-[#2FA66A]/10 border-[#2FA66A]/20",
    },
    {
      id: "next-emi",
      title: "Next EMI Due",
      value: data?.next_emi ? formatCurrency(nextEmiAmount ?? 0) : "₹0",
      subtitle: data?.next_emi
        ? `${nextEmiLender} • Due ${nextEmiDueDate}`
        : "No active EMI liability",
      icon: CalendarClock,
      color: "text-[#D58A00]",
      bgColor: "bg-[#D58A00]/10 border-[#D58A00]/20",
      badge: data?.next_emi ? `${nextEmiDaysLeft}d left` : undefined,
    },
    {
      id: "sips",
      title: "Active Monthly SIPs",
      value: `${formatCurrency(activeSips ?? 0)}/mo`,
      subtitle: (activeSips ?? 0) > 0 ? "Mutual Fund commitments" : "No active SIPs",
      icon: PieChart,
      color: "text-[#4267D5]",
      bgColor: "bg-[#4267D5]/10 border-[#4267D5]/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full select-none font-ui">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: idx * 0.05,
            }}
            className="relative p-4 rounded-lg bg-surface border border-border-default shadow-xs hover:border-border-strong transition-colors duration-150 flex flex-col justify-between overflow-hidden"
          >
            {/* Top Row: Icon & Badge */}
            <div className="flex items-center justify-between mb-3">
              <div
                className={clsx(
                  "w-8 h-8 rounded flex items-center justify-center border",
                  card.bgColor
                )}
              >
                <Icon className={clsx("w-4 h-4", card.color)} />
              </div>

              {card.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F8F7F4] text-[#D58A00] border border-[#D58A00]/20">
                  {card.badge}
                </span>
              )}
            </div>

            {/* Title & Value */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-text-muted">
                {card.title}
              </span>
              <span className="text-xl font-bold font-mono tracking-tight text-text-primary">
                {card.value}
              </span>
              <span className="text-[11px] text-text-secondary truncate mt-0.5">
                {card.subtitle}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
