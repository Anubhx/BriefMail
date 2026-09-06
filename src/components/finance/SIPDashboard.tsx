"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, FileText, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
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
  sips = [],
  totalValue,
  totalInvested,
  overallReturnsPct,
}: SIPDashboardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const defaultSIPs: SIPItem[] = [
    {
      id: "sip-1",
      fund_name: "Mirae Asset Large Cap Fund",
      category: "Equity",
      monthly_amount: 5000,
      total_invested: 150000,
      current_value: 192500,
      returns_pct: 28.33,
    },
    {
      id: "sip-2",
      fund_name: "Parag Parikh Flexi Cap Fund",
      category: "Flexi Cap",
      monthly_amount: 5000,
      total_invested: 140000,
      current_value: 178000,
      returns_pct: 27.14,
    },
    {
      id: "sip-3",
      fund_name: "UTI Nifty 50 Index Fund",
      category: "Index",
      monthly_amount: 3000,
      total_invested: 60000,
      current_value: 71500,
      returns_pct: 19.16,
    },
    {
      id: "sip-4",
      fund_name: "Axis Small Cap Fund",
      category: "Small Cap",
      monthly_amount: 2000,
      total_invested: 40000,
      current_value: 43000,
      returns_pct: 7.5,
    },
  ];

  const list = sips.length > 0 ? sips : defaultSIPs;
  const portfolioTotal = totalValue ?? list.reduce((a, b) => a + b.current_value, 0);
  const investedTotal = totalInvested ?? list.reduce((a, b) => a + b.total_invested, 0);
  const overallReturn = overallReturnsPct ?? Math.round(((portfolioTotal - investedTotal) / investedTotal) * 10000) / 100;

  // Chart segment colors
  const colors = ["#6366F1", "#10B981", "#F59E0B", "#06B6D4", "#EC4899"];

  return (
    <div className="flex flex-col gap-6 w-full font-ui select-none">
      {/* CAS Parser Notice Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-brand-subtle/50 border border-brand/20 text-xs text-brand">
        <FileText className="w-4 h-4 shrink-0 text-brand" />
        <span className="leading-normal">
          <strong>Auto-synced Portfolio:</strong> Extracted directly from your consolidated account statement (CAS) emails.
        </span>
      </div>

      {/* Summary Metrics & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Banner */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-surface border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4 mb-4">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
                Total Portfolio Value
              </span>
              <h2 className="text-3xl font-bold font-mono text-text-primary tracking-tight">
                {formatCurrency(portfolioTotal)}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 border",
                  overallReturn >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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
              <span className="text-lg font-bold font-mono text-text-secondary">
                {formatCurrency(investedTotal)}
              </span>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Total Gain / Profit</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                +{formatCurrency(portfolioTotal - investedTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Distribution SVG Donut Chart */}
        <div className="p-5 rounded-xl bg-surface border border-border-subtle shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand" /> Portfolio Distribution
          </h3>

          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let accumulated = 0;
                return list.map((item, idx) => {
                  const pct = (item.current_value / portfolioTotal) * 100;
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
                      className="transition-all duration-300 cursor-pointer hover:opacity-80"
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
                <span>{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIP Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="p-5 rounded-xl bg-surface border border-border-subtle hover:border-brand/30 transition-all duration-200 shadow-sm flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-subtle text-brand border border-brand/20 mb-1.5 inline-block">
                  {item.category}
                </span>
                <h4 className="text-sm font-bold text-text-primary leading-tight">
                  {item.fund_name}
                </h4>
              </div>

              <span
                className={clsx(
                  "px-2 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-0.5 border shrink-0",
                  item.returns_pct >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                )}
              >
                {item.returns_pct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {item.returns_pct >= 0 ? `+${item.returns_pct}%` : `${item.returns_pct}%`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border-subtle/50 pt-3 text-xs font-mono">
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
                <span className="font-bold text-emerald-400">{formatCurrency(item.current_value)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
