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
  subscriptions?: SubscriptionItem[] | null;
}

const formatCurrency = (val?: number | null) => {
  const safeVal = typeof val === "number" && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeVal);
};

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
  // Clean empty state when no subscriptions
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border-default rounded-lg text-text-muted text-sm font-ui bg-surface-secondary flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-primary">No data yet</p>
        <p className="text-xs text-text-muted">Recurring subscriptions, renewals, and billing emails will appear here.</p>
      </div>
    );
  }

  const list = subscriptions ?? [];
  const activeSubs = list.filter((s) => s?.status === "active");
  const totalMonthlyCost = activeSubs.reduce((a, b) => a + (b?.cost ?? 0), 0);

  return (
    <div className="flex flex-col gap-4 w-full font-ui select-none">
      {/* Header Commitment Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-lg bg-surface border border-border-default shadow-xs">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted">
            Recurring Monthly Commitment
          </span>
          <h2 className="text-2xl font-bold font-mono text-text-primary tracking-tight mt-0.5">
            {formatCurrency(totalMonthlyCost ?? 0)}/mo
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-secondary text-xs font-mono text-text-secondary border border-border-default">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2FA66A]" />
          <span>{activeSubs.length} Active / {list.length} Total</span>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {list.map((sub, idx) => {
          if (!sub) return null;
          const isActive = sub.status === "active";
          const subCost = sub.cost ?? 0;
          const serviceName = sub.service ?? "Subscription";
          const catName = sub.category ?? "General";
          const nextBillStr = sub.next_billing ? String(sub.next_billing) : "Upcoming";

          return (
            <motion.div
              key={sub.id ?? idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className="p-4 rounded-lg bg-surface border border-border-default hover:border-border-strong transition-colors duration-150 shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "w-9 h-9 rounded border flex items-center justify-center font-bold",
                      isActive
                        ? "bg-[#8B5CC7]/10 border-[#8B5CC7]/20 text-[#8B5CC7]"
                        : "bg-surface-secondary border-border-default text-text-muted"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{serviceName}</h3>
                    <span className="text-xs text-text-muted">{catName}</span>
                  </div>
                </div>

                <span
                  className={clsx(
                    "px-2 py-0.5 rounded text-[10px] font-mono font-semibold border flex items-center gap-1",
                    isActive
                      ? "bg-[#2FA66A]/10 text-[#2FA66A] border-[#2FA66A]/20"
                      : "bg-surface-secondary text-text-muted border-border-default"
                  )}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> {sub.status ?? "active"}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> {sub.status ?? "inactive"}
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border-default pt-2.5 text-xs font-mono">
                <div className="flex items-center gap-1 text-text-muted">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Next bill: {nextBillStr}</span>
                </div>
                <span className="text-sm font-bold text-text-primary">
                  {formatCurrency(subCost ?? 0)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
