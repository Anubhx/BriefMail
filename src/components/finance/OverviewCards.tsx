"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, CalendarClock, PieChart, Receipt } from "lucide-react";
import { clsx } from "clsx";

export interface OverviewData {
  has_data?: boolean;
  total_debits_this_month: number;
  total_credits_this_month: number;
  next_emi: {
    lender: string;
    amount: number;
    due_date: string;
    days_left: number;
  } | null;
  active_sips_total: number;
}

interface OverviewCardsProps {
  data?: OverviewData;
  isLoading?: boolean;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none font-ui">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-surface border border-border-subtle shadow-sm animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
            <div className="flex flex-col gap-2">
              <div className="w-24 h-3 bg-surface-elevated rounded" />
              <div className="w-32 h-5 bg-surface-elevated rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Clean empty state when data is not available or has_data is false
  if (!data || data.has_data === false) {
    return (
      <div className="p-8 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm font-ui bg-surface/30 flex flex-col items-center justify-center gap-2">
        <Receipt className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-secondary">No financial emails processed yet</p>
        <p className="text-xs text-text-muted">Monthly debits, credits, upcoming EMI, and SIP totals will appear here.</p>
      </div>
    );
  }

  const cards = [
    {
      id: "debits",
      title: "Debits (This Month)",
      value: formatCurrency(data.total_debits_this_month || 0),
      subtitle: data.total_debits_this_month > 0 ? "Bank & UPI transactions" : "No debits this month",
      icon: TrendingDown,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "credits",
      title: "Credits (This Month)",
      value: formatCurrency(data.total_credits_this_month || 0),
      subtitle: data.total_credits_this_month > 0 ? "Salary & incoming credits" : "No credits this month",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "next-emi",
      title: "Next EMI Due",
      value: data.next_emi ? formatCurrency(data.next_emi.amount) : "₹0",
      subtitle: data.next_emi
        ? `${data.next_emi.lender} • Due ${data.next_emi.due_date}`
        : "No active EMI liability",
      icon: CalendarClock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      badge: data.next_emi ? `${data.next_emi.days_left} days left` : undefined,
    },
    {
      id: "sips",
      title: "Active Monthly SIPs",
      value: `${formatCurrency(data.active_sips_total || 0)}/mo`,
      subtitle: data.active_sips_total > 0 ? "Mutual Fund commitments" : "No active SIPs",
      icon: PieChart,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none font-ui">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              delay: idx * 0.08,
            }}
            className="relative p-4 rounded-xl bg-surface border border-border-subtle shadow-sm hover:border-brand/30 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
          >
            {/* Top Row: Icon & Badge */}
            <div className="flex items-center justify-between mb-3">
              <div
                className={clsx(
                  "w-9 h-9 rounded-lg flex items-center justify-center border transition-transform duration-200 group-hover:scale-105",
                  card.bgColor
                )}
              >
                <Icon className={clsx("w-4 h-4", card.color)} />
              </div>

              {card.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {card.badge}
                </span>
              )}
            </div>

            {/* Title & Value */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-muted">
                {card.title}
              </span>
              <span className="text-xl font-bold font-mono tracking-tight text-text-primary">
                {card.value}
              </span>
              <span className="text-[11px] text-text-secondary">
                {card.subtitle}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
