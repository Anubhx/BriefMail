"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, Building2 } from "lucide-react";
import { clsx } from "clsx";

export interface AmortizationRow {
  month: string;
  principal: number;
  interest: number;
  balance: number;
}

export interface EMIItem {
  id: string;
  lender: string;
  loan_type: string;
  total_amount: number;
  remaining_amount: number;
  monthly_emi: number;
  tenure_months: number;
  months_paid: number;
  next_due: string;
  interest_rate: number;
  amortization?: AmortizationRow[];
}

interface EMITimelineProps {
  items?: EMIItem[] | null;
  totalOutstanding?: number | null;
}

const formatCurrency = (val?: number | null) => {
  const safeVal = typeof val === "number" && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeVal);
};

export function EMITimeline({ items, totalOutstanding }: EMITimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Clean empty state if no items
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border-default rounded-lg text-text-muted text-sm font-ui bg-surface-secondary flex flex-col items-center justify-center gap-2">
        <Building2 className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-primary">No data yet</p>
        <p className="text-xs text-text-muted">EMI and loan tracking will appear here once loan statement emails arrive.</p>
      </div>
    );
  }

  const list = items ?? [];
  const grandTotal =
    totalOutstanding != null
      ? (totalOutstanding ?? 0)
      : list.reduce((acc, i) => acc + (i?.remaining_amount ?? 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-4 w-full font-ui select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-lg bg-surface border border-border-default shadow-xs">
        <div>
          <h2 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted">
            Total Outstanding Liability
          </h2>
          <span className="text-2xl font-bold font-mono text-text-primary tracking-tight mt-0.5 block">
            {formatCurrency(grandTotal ?? 0)}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-secondary text-xs font-mono text-text-secondary border border-border-default">
          <Building2 className="w-3.5 h-3.5 text-text-muted" />
          <span>{list.length} Active {list.length === 1 ? "Loan" : "Loans"}</span>
        </div>
      </div>

      {/* EMI Visual Timeline List */}
      <div className="flex flex-col gap-3">
        {list.map((item) => {
          if (!item) return null;
          const isExpanded = expandedId === item.id;
          const tenureMonths = item.tenure_months ?? 0;
          const monthsPaid = item.months_paid ?? 0;
          const monthsRemaining = Math.max(0, tenureMonths - monthsPaid);
          const pctPaid =
            tenureMonths > 0
              ? Math.min(100, Math.round(((monthsPaid ?? 0) / tenureMonths) * 100))
              : 0;
          const lenderName = item.lender ?? "Lender";
          const lenderBadge = (lenderName ?? "").slice(0, 2).toUpperCase();
          const monthlyEmi = item.monthly_emi ?? 0;
          const interestRate = item.interest_rate ?? 0;
          const remainingAmt = item.remaining_amount ?? 0;
          const nextDueStr = item.next_due ? String(item.next_due) : "Upcoming";

          return (
            <div
              key={item.id}
              className="p-4 rounded-lg bg-surface border border-border-default hover:border-border-strong transition-colors duration-150 shadow-xs"
            >
              {/* Top Row: Lender & Amounts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-surface-secondary border border-border-default flex items-center justify-center text-text-primary font-bold text-xs font-mono">
                    {lenderBadge}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {lenderName}
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-secondary text-text-muted border border-border-default">
                        {item.loan_type ?? "Loan"}
                      </span>
                    </h3>
                    <span className="text-xs font-mono text-text-muted">
                      {formatCurrency(monthlyEmi ?? 0)}/mo • {(interestRate ?? 0)}% p.a.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <span className="text-[10px] text-text-muted block">Remaining</span>
                    <span className="text-sm font-bold font-mono text-text-primary">
                      {formatCurrency(remainingAmt ?? 0)}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F8F7F4] text-[#D58A00] border border-[#D58A00]/20">
                    {monthsRemaining}m left
                  </span>
                </div>
              </div>

              {/* Progress Bar Timeline */}
              <div className="flex flex-col gap-1.5 my-2.5">
                <div className="flex justify-between text-[11px] font-mono text-text-muted">
                  <span>{pctPaid}% paid ({monthsPaid} mos)</span>
                  <span>Due {nextDueStr}</span>
                </div>

                <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden p-0.5 border border-border-default">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctPaid}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-[#2FA66A] rounded-full"
                  />
                </div>
              </div>

              {/* Expand Toggle Button */}
              {(item.amortization ?? []).length > 0 && (
                <>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="mt-2 flex items-center justify-between w-full pt-2 border-t border-border-default text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      {isExpanded ? "Hide Amortization Schedule" : "View Amortization Schedule"}
                    </span>
                    <ChevronDown
                      className={clsx("w-4 h-4 transition-transform duration-200 text-text-muted", isExpanded && "rotate-180")}
                    />
                  </button>

                  {/* Collapsible Amortization Table */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-border-default"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-mono">
                            <thead>
                              <tr className="border-b border-border-default text-text-muted text-[11px]">
                                <th className="py-1.5 font-medium">Month</th>
                                <th className="py-1.5 font-medium">Principal</th>
                                <th className="py-1.5 font-medium">Interest</th>
                                <th className="py-1.5 font-medium text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default text-text-secondary">
                              {(item.amortization ?? []).map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-surface-secondary/50">
                                  <td className="py-1.5">{row?.month ?? "Month"}</td>
                                  <td className="py-1.5 text-[#2FA66A]">{formatCurrency(row?.principal ?? 0)}</td>
                                  <td className="py-1.5 text-text-muted">{formatCurrency(row?.interest ?? 0)}</td>
                                  <td className="py-1.5 text-right font-bold text-text-primary">
                                    {formatCurrency(row?.balance ?? 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
