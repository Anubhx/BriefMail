"use client";

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Calendar, CheckCircle2, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

export interface SubscriptionItem {
  id: string;
  service: string;
  category: string;
  cost: number;
  billing_cycle: string;
  next_billing: string;
  status: "active" | "paused" | "canceled";
}

interface SubscriptionsListProps {
  subscriptions?: SubscriptionItem[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export function SubscriptionsList({ subscriptions = [] }: SubscriptionsListProps) {
  const defaultSubscriptions: SubscriptionItem[] = [
    {
      id: "sub-1",
      service: "Netflix Premium",
      category: "Entertainment",
      cost: 649,
      billing_cycle: "Monthly",
      next_billing: "2026-10-02",
      status: "active",
    },
    {
      id: "sub-2",
      service: "AWS Cloud Infrastructure",
      category: "Developer Tools",
      cost: 2450,
      billing_cycle: "Monthly",
      next_billing: "2026-10-01",
      status: "active",
    },
    {
      id: "sub-3",
      service: "Spotify Duo",
      category: "Music",
      cost: 149,
      billing_cycle: "Monthly",
      next_billing: "2026-09-25",
      status: "active",
    },
    {
      id: "sub-4",
      service: "Cult.fit Gym Membership",
      category: "Fitness",
      cost: 1500,
      billing_cycle: "Monthly",
      next_billing: "2026-09-15",
      status: "active",
    },
  ];

  const list = subscriptions.length > 0 ? subscriptions : defaultSubscriptions;
  const totalMonthlyCost = list.reduce((a, b) => a + b.cost, 0);

  return (
    <div className="flex flex-col gap-6 w-full font-ui select-none">
      {/* Header Commitment Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-xl bg-surface border border-border-subtle shadow-sm">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Recurring Monthly Commitment
          </span>
          <h2 className="text-2xl font-bold font-mono text-text-primary tracking-tight">
            {formatCurrency(totalMonthlyCost)}/mo
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated text-xs font-mono text-text-secondary border border-border-subtle">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{list.length} Active Subscriptions</span>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((sub, idx) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="p-5 rounded-xl bg-surface border border-border-subtle hover:border-brand/30 transition-all duration-200 shadow-sm flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{sub.service}</h3>
                  <span className="text-xs text-text-muted">{sub.category}</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {sub.status}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle/50 pt-3 text-xs font-mono">
              <div className="flex items-center gap-1 text-text-muted">
                <Calendar className="w-3.5 h-3.5" />
                <span>Next bill: {sub.next_billing}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">
                {formatCurrency(sub.cost)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
