"use client";

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Calendar, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
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

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
  // Clean empty state when no subscriptions
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="p-10 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm font-ui bg-surface/30 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-secondary">No financial emails processed yet</p>
        <p className="text-xs text-text-muted">Recurring subscriptions, renewals, and billing emails will appear here.</p>
      </div>
    );
  }

  const list = subscriptions;
  const activeSubs = list.filter((s) => s.status === "active");
  const totalMonthlyCost = activeSubs.reduce((a, b) => a + (b.cost || 0), 0);

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
          <span>{activeSubs.length} Active / {list.length} Total Subscriptions</span>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((sub, idx) => {
          const isActive = sub.status === "active";

          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-5 rounded-xl bg-surface border border-border-subtle hover:border-brand/30 transition-all duration-200 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-lg border flex items-center justify-center font-bold",
                      isActive
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                        : "bg-surface-elevated border-border-subtle text-text-muted"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{sub.service}</h3>
                    <span className="text-xs text-text-muted">{sub.category}</span>
                  </div>
                </div>

                <span
                  className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  )}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> {sub.status}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> {sub.status}
                    </>
                  )}
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
          );
        })}
      </div>
    </div>
  );
}
