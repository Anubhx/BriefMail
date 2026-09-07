"use client";

import React, { useState, useMemo } from "react";
import { Search, ArrowUpRight, ArrowDownLeft, CreditCard, Landmark, Smartphone } from "lucide-react";
import { clsx } from "clsx";

export interface TransactionItem {
  id: string;
  date: string;
  description: string;
  merchant: string;
  category: string;
  amount: number;
  type: "credit" | "debit";
  payment_mode: "UPI" | "Card" | "NetBanking" | string;
}

interface TransactionListProps {
  transactions?: TransactionItem[];
}

const formatCurrency = (val?: number | null) => {
  const safeVal = typeof val === "number" && !isNaN(val) ? val : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeVal);
};

export function TransactionList({ transactions }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Filter transactions - must be called unconditionally before any return
  const filteredList = useMemo(() => {
    const list = transactions ?? [];
    return list.filter((item) => {
      if (!item) return false;
      const desc = item.description ?? "";
      const merch = item.merchant ?? "";
      const cat = item.category ?? "";
      const query = (searchQuery ?? "").toLowerCase();
      const matchesSearch =
        desc.toLowerCase().includes(query) ||
        merch.toLowerCase().includes(query) ||
        cat.toLowerCase().includes(query);

      const itemMode = (item.payment_mode ?? "").toLowerCase();
      const matchesMode =
        selectedMode === "all" || itemMode === (selectedMode ?? "").toLowerCase();

      const itemType = (item.type ?? "").toLowerCase();
      const matchesType =
        selectedType === "all" || itemType === (selectedType ?? "").toLowerCase();

      return matchesSearch && matchesMode && matchesType;
    });
  }, [transactions, searchQuery, selectedMode, selectedType]);

  // Group by date - must be called unconditionally before any return
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};
    filteredList.forEach((tx) => {
      if (!tx) return;
      const d = tx.date ?? "Recent";
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    });
    return groups;
  }, [filteredList]);

  // Clean empty state if no transactions
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-10 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm font-ui bg-surface/30 flex flex-col items-center justify-center gap-2">
        <CreditCard className="w-8 h-8 text-text-muted/50 mb-1" />
        <p className="font-medium text-text-secondary">No data yet</p>
        <p className="text-xs text-text-muted">Bank debit/credit alerts and transaction receipts will appear here.</p>
      </div>
    );
  }

  const getModeIcon = (mode?: string | null) => {
    switch ((mode ?? "").toUpperCase()) {
      case "UPI":
        return <Smartphone className="w-3.5 h-3.5 text-[#4267D5]" />;
      case "CARD":
        return <CreditCard className="w-3.5 h-3.5 text-[#8B5CC7]" />;
      case "NETBANKING":
        return <Landmark className="w-3.5 h-3.5 text-[#2FA66A]" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-4 w-full font-ui select-none">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-surface border border-border-default shadow-xs">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search merchant or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-surface-secondary text-xs font-ui text-text-primary placeholder:text-text-muted border border-border-default focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* Mode Selector */}
          <div className="flex items-center gap-0.5 bg-surface-secondary p-0.5 rounded border border-border-default text-xs">
            {["all", "UPI", "Card", "NetBanking"].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={clsx(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors capitalize",
                  selectedMode === mode
                    ? "bg-surface text-text-primary font-semibold shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1 rounded bg-surface-secondary text-xs font-ui text-text-secondary border border-border-default focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="debit">Debits Only</option>
            <option value="credit">Credits Only</option>
          </select>
        </div>
      </div>

      {/* Grouped Transaction List */}
      <div className="flex flex-col gap-4">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border-default rounded-lg text-text-muted text-sm font-ui bg-surface-secondary">
            No transactions match your search filter
          </div>
        ) : (
          Object.entries(groupedByDate).map(([dateStr, items]) => {
            const dateDisplay = dateStr === todayStr ? "Today" : (dateStr ? String(dateStr) : "Recent");
            const entryCount = (items || []).length;

            return (
              <div key={dateStr} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider">
                    {dateDisplay}
                  </span>
                  <span className="text-[11px] font-mono text-text-muted">
                    {entryCount} {entryCount === 1 ? "entry" : "entries"}
                  </span>
                </div>

                <div className="bg-surface border border-border-default rounded-lg divide-y divide-border-default overflow-hidden shadow-xs">
                  {(items || []).map((tx) => {
                    if (!tx) return null;
                    const isCredit = tx.type === "credit";
                    const txAmount = tx.amount ?? 0;

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 hover:bg-surface-secondary/60 transition-colors duration-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={clsx(
                              "w-8 h-8 rounded flex items-center justify-center shrink-0 border",
                              isCredit
                                ? "bg-[#2FA66A]/10 text-[#2FA66A] border-[#2FA66A]/20"
                                : "bg-surface-secondary text-text-muted border-border-default"
                            )}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-[#2FA66A]" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-text-muted" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {tx.merchant || tx.description || "Transaction"}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                {getModeIcon(tx.payment_mode)}
                                {tx.payment_mode ?? "UPI"}
                              </span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-secondary text-[10px] font-mono text-text-secondary border border-border-default">
                                {tx.category ?? "General"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono">
                          <span
                            className={clsx(
                              "text-sm font-bold block",
                              isCredit ? "text-[#2FA66A]" : "text-text-primary"
                            )}
                          >
                            {isCredit ? `+${formatCurrency(txAmount ?? 0)}` : `-${formatCurrency(txAmount ?? 0)}`}
                          </span>
                          <span className="text-[10px] text-text-muted uppercase font-mono">
                            {tx.type ?? "debit"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
