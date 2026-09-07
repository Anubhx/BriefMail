"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { clsx } from "clsx";

export interface SIPItem {
  id: string;
  fund_name: string;
  category: string;
  monthly_amount: number;
  total_invested: number;
  current_value: number;
  returns_pct: number;
}

interface SIPDashboardProps {
  sips?: SIPItem[];
  totalValue?: number;
  totalInvested?: number;
  overallReturnsPct?: number;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export function SIPDashboard({
  sips,
  totalValue,
  totalInvested,
  overallReturnsPct,
}: SIPDashboardProps) {
  const [, setHoveredIdx] = useState<number | null>(null);

  // Clean empty state when no SIPs or investment emails
  if (!sips || sips.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border-default rounded-lg text-text-muted text-sm font-ui bg-surface-secondary flex flex-col items-center justify-center gap-2">
        <Layers className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-primary">No financial emails processed yet</p>
        <p className="text-xs text-text-muted">Mutual fund SIP statements and investment notifications will appear here.</p>
      </div>
    );
  }

  const list = sips;
  const portfolioTotal = totalValue ?? list.reduce((a, b) => a + (b.current_value || 0), 0);
  const investedTotal = totalInvested ?? list.reduce((a, b) => a + (b.total_invested || 0), 0);
  const overallReturn =
    overallReturnsPct ??
    (investedTotal > 0
      ? Math.round(((portfolioTotal - investedTotal) / investedTotal) * 10000) / 100
      : 0);

  // Soft muted category colors
  const colors = ["#4267D5", "#2FA66A", "#D58A00", "#309BA8", "#8B5CC7"];

  return (
    <div className="flex flex-col gap-5 w-full font-ui select-none">
      {/* Notice Banner */}
      <div className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-secondary border border-border-default text-xs text-text-secondary">
        <FileText className="w-4 h-4 shrink-0 text-text-muted" />
        <span className="leading-normal">
          <strong className="text-text-primary">Auto-synced Portfolio:</strong> Extracted directly from your consolidated account statement (CAS) emails.
        </span>
      </div>

      {/* Summary Metrics & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric Banner */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-lg bg-surface border border-border-default shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4 mb-4">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                Total Portfolio Value
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight mt-0.5">
                {formatCurrency(portfolioTotal)}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 border",
                  overallReturn >= 0
                    ? "bg-[#2FA66A]/10 text-[#2FA66A] border-[#2FA66A]/20"
                    : "bg-[#CF421C]/10 text-[#CF421C] border-[#CF421C]/20"
                )}
              >
                {overallReturn >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {overallReturn >= 0 ? `+${overallReturn}%` : `${overallReturn}%`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-text-muted block">Total Invested</span>
              <span className="text-base font-bold font-mono text-text-secondary">
                {formatCurrency(investedTotal)}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Total Gain / Profit</span>
              <span
                className={clsx(
                  "text-base font-bold font-mono",
                  portfolioTotal >= investedTotal ? "text-[#2FA66A]" : "text-[#CF421C]"
                )}
              >
                {portfolioTotal >= investedTotal ? "+" : ""}
                {formatCurrency(portfolioTotal - investedTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Distribution SVG Donut Chart */}
        <div className="p-4 sm:p-5 rounded-lg bg-surface border border-border-default shadow-xs flex flex-col items-center justify-center text-center">
          <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-text-muted" /> Portfolio Distribution
          </h3>

          <div className="relative w-32 h-32 flex items-center justify-center my-2">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let accumulated = 0;
                return list.map((item, idx) => {
                  const pct = portfolioTotal > 0 ? (item.current_value / portfolioTotal) * 100 : 100 / list.length;
                  const dashArray = `${pct} ${100 - pct}`;
                  const offset = accumulated;
                  accumulated += pct;

                  return (
                    <circle
                      key={item.id}
                      cx="50"
                      cy="50"
                      r="15.915"
                      fill="transparent"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="6"
                      strokeDasharray={dashArray}
                      strokeDashoffset={-offset}
                      className="transition-all duration-200 cursor-pointer hover:opacity-80"
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                });
              })()}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-text-muted">Funds</span>
              <span className="text-sm font-bold font-mono text-text-primary">{list.length}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {list.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-1 text-[10px] font-mono text-text-secondary">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="truncate max-w-[120px]">{item.category || item.fund_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIP Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {list.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className="p-4 rounded-lg bg-surface border border-border-default hover:border-border-strong transition-colors duration-150 shadow-xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-secondary text-text-secondary border border-border-default mb-1 inline-block">
                  {item.category}
                </span>
                <h4 className="text-sm font-semibold text-text-primary leading-tight">
                  {item.fund_name}
                </h4>
              </div>

              <span
                className={clsx(
                  "px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-0.5 border shrink-0",
                  item.returns_pct >= 0
                    ? "bg-[#2FA66A]/10 text-[#2FA66A] border-[#2FA66A]/20"
                    : "bg-[#CF421C]/10 text-[#CF421C] border-[#CF421C]/20"
                )}
              >
                {item.returns_pct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {item.returns_pct >= 0 ? `+${item.returns_pct}%` : `${item.returns_pct}%`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border-default pt-2.5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-text-muted block">SIP / Mo</span>
                <span className="font-semibold text-text-primary">{formatCurrency(item.monthly_amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Invested</span>
                <span className="text-text-secondary">{formatCurrency(item.total_invested)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted block">Current Value</span>
                <span
                  className={clsx(
                    "font-bold",
                    item.current_value >= item.total_invested ? "text-[#2FA66A]" : "text-[#CF421C]"
                  )}
                >
                  {formatCurrency(item.current_value)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
