"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, Percent, Building2 } from "lucide-react";
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
  items?: EMIItem[];
  totalOutstanding?: number;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export function EMITimeline({ items = [], totalOutstanding }: EMITimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Default fallback data if empty
  const defaultItems: EMIItem[] = [
    {
      id: "emi-1",
      lender: "HDFC Bank",
      loan_type: "Home Loan",
      total_amount: 2500000,
      remaining_amount: 1620000,
      monthly_emi: 24500,
      tenure_months: 240,
      months_paid: 72,
      next_due: "2026-09-12",
      interest_rate: 8.5,
      amortization: [
        { month: "Sep 2026", principal: 13000, interest: 11500, balance: 1607000 },
        { month: "Oct 2026", principal: 13100, interest: 11400, balance: 1593900 },
        { month: "Nov 2026", principal: 13200, interest: 11300, balance: 1580700 },
      ],
    },
    {
      id: "emi-2",
      lender: "ICICI Bank",
      loan_type: "Car Loan",
      total_amount: 600000,
      remaining_amount: 225000,
      monthly_emi: 12500,
      tenure_months: 60,
      months_paid: 30,
      next_due: "2026-09-18",
      interest_rate: 9.1,
      amortization: [
        { month: "Sep 2026", principal: 10800, interest: 1700, balance: 214200 },
        { month: "Oct 2026", principal: 10900, interest: 1600, balance: 203300 },
      ],
    },
  ];

  const list = items.length > 0 ? items : defaultItems;
  const grandTotal = totalOutstanding ?? list.reduce((acc, i) => acc + i.remaining_amount, 0);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6 w-full font-ui select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-xl bg-surface border border-border-subtle shadow-sm">
        <div>
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            Total Outstanding Liability
          </h2>
          <span className="text-2xl font-bold font-mono text-text-primary tracking-tight">
            {formatCurrency(grandTotal)}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated text-xs font-mono text-text-secondary border border-border-subtle">
          <Building2 className="w-4 h-4 text-brand" />
          <span>{list.length} Active Loans</span>
        </div>
      </div>

      {/* EMI Visual Timeline List */}
      <div className="flex flex-col gap-4">
        {list.map((item) => {
          const isExpanded = expandedId === item.id;
          const monthsRemaining = item.tenure_months - item.months_paid;
          const pctPaid = Math.min(100, Math.round((item.months_paid / item.tenure_months) * 100));

          return (
            <div
              key={item.id}
              className="p-5 rounded-xl bg-surface border border-border-subtle hover:border-brand/30 transition-all duration-200 shadow-sm"
            >
              {/* Top Row: Lender & Amounts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-subtle flex items-center justify-center text-brand font-bold text-sm">
                    {item.lender.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {item.lender}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-elevated text-text-muted">
                        {item.loan_type}
                      </span>
                    </h3>
                    <span className="text-xs font-mono text-text-muted">
                      {formatCurrency(item.monthly_emi)}/mo • {item.interest_rate}% p.a.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <span className="text-xs text-text-muted block">Remaining</span>
                    <span className="text-sm font-bold font-mono text-text-primary">
                      {formatCurrency(item.remaining_amount)}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {monthsRemaining} months left
                  </span>
                </div>
              </div>

              {/* Progress Bar Timeline */}
              <div className="flex flex-col gap-1.5 my-3">
                <div className="flex justify-between text-[11px] font-mono text-text-muted">
                  <span>{pctPaid}% paid ({item.months_paid} mos)</span>
                  <span>Due {item.next_due}</span>
                </div>

                <div className="h-2.5 w-full bg-surface-elevated rounded-full overflow-hidden p-0.5 border border-border-subtle">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pctPaid}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-emerald-500 rounded-full shadow-sm"
                  />
                </div>
              </div>

              {/* Expand Toggle Button */}
              <button
                onClick={() => toggleExpand(item.id)}
                className="mt-2 flex items-center justify-between w-full pt-2 border-t border-border-subtle/50 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  {isExpanded ? "Hide Amortization Schedule" : "View Amortization Schedule"}
                </span>
                <ChevronDown
                  className={clsx("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")}
                />
              </button>

              {/* Collapsible Amortization Table */}
              <AnimatePresence>
                {isExpanded && item.amortization && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-3 pt-3 border-t border-border-subtle"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-border-subtle text-text-muted text-[11px]">
                            <th className="py-1.5 font-medium">Month</th>
                            <th className="py-1.5 font-medium">Principal</th>
                            <th className="py-1.5 font-medium">Interest</th>
                            <th className="py-1.5 font-medium text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/30 text-text-secondary">
                          {item.amortization.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-surface-elevated/40">
                              <td className="py-1.5">{row.month}</td>
                              <td className="py-1.5 text-emerald-400">{formatCurrency(row.principal)}</td>
                              <td className="py-1.5 text-rose-400">{formatCurrency(row.interest)}</td>
                              <td className="py-1.5 text-right font-bold text-text-primary">
                                {formatCurrency(row.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
