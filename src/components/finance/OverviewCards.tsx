"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, CalendarClock, PieChart } from "lucide-react";
import { clsx } from "clsx";

export interface OverviewData {
  total_debits_this_month: number;
  total_credits_this_month: number;
  next_emi: {
    lender: string;
    amount: number;
    due_date: string;
    days_left: number;
  };
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
  const cards = [
    {
      id: "debits",
      title: "Debits (This Month)",
      value: data ? formatCurrency(data.total_debits_this_month) : "₹42,850",
      subtitle: "34 transactions",
      icon: TrendingDown,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "credits",
      title: "Credits (This Month)",
      value: data ? formatCurrency(data.total_credits_this_month) : "₹1,25,000",
      subtitle: "Salary & refunds",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "next-emi",
      title: "Next EMI Due",
      value: data ? formatCurrency(data.next_emi.amount) : "₹24,500",
      subtitle: data ? `${data.next_emi.lender} • Due ${data.next_emi.due_date}` : "HDFC Bank • Due Sep 12",
      icon: CalendarClock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      badge: data ? `${data.next_emi.days_left} days left` : "6 days left",
    },
    {
      id: "sips",
      title: "Active Monthly SIPs",
      value: data ? `${formatCurrency(data.active_sips_total)}/mo` : "₹15,000/mo",
      subtitle: "Across 4 Mutual Funds",
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
            className={clsx(
              "relative p-4 rounded-xl bg-surface border border-border-subtle shadow-sm hover:border-brand/30 transition-all duration-200 flex flex-col justify-between overflow-hidden group",
              isLoading && "animate-pulse opacity-75"
            )}
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
