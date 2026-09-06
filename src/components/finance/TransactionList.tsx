"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownLeft, CreditCard, Landmark, Smartphone } from "lucide-react";
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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

export function TransactionList({ transactions = [] }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const defaultTransactions: TransactionItem[] = [
    {
      id: "tx-1",
      date: "2026-09-06",
      description: "Swiggy Food Delivery",
      merchant: "Swiggy",
      category: "Food",
      amount: 485,
      type: "debit",
      payment_mode: "UPI",
    },
    {
      id: "tx-2",
      date: "2026-09-06",
      description: "Salary Credit - Acme Corp",
      merchant: "Acme Corp",
      category: "Income",
      amount: 125000,
      type: "credit",
      payment_mode: "NetBanking",
    },
    {
      id: "tx-3",
      date: "2026-09-05",
      description: "Amazon India Shopping",
      merchant: "Amazon",
      category: "Shopping",
      amount: 2499,
      type: "debit",
      payment_mode: "Card",
    },
    {
      id: "tx-4",
      date: "2026-09-04",
      description: "Uber Trip to Airport",
      merchant: "Uber",
      category: "Travel",
      amount: 650,
      type: "debit",
      payment_mode: "UPI",
    },
    {
      id: "tx-5",
      date: "2026-09-02",
      description: "Netflix Premium Subscription",
      merchant: "Netflix",
      category: "Entertainment",
      amount: 649,
      type: "debit",
      payment_mode: "Card",
    },
  ];

  const list = transactions.length > 0 ? transactions : defaultTransactions;

  // Filter transactions
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMode =
        selectedMode === "all" || item.payment_mode.toLowerCase() === selectedMode.toLowerCase();

      const matchesType =
        selectedType === "all" || item.type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesMode && matchesType;
    });
  }, [list, searchQuery, selectedMode, selectedType]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};
    filteredList.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredList]);

  const getModeIcon = (mode: string) => {
    switch (mode.toUpperCase()) {
      case "UPI":
        return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
      case "CARD":
        return <CreditCard className="w-3.5 h-3.5 text-purple-400" />;
      case "NETBANKING":
        return <Landmark className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full font-ui select-none">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border-subtle shadow-sm">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search merchant or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-elevated text-xs font-ui text-text-primary placeholder:text-text-muted border border-border-subtle focus:outline-none focus:border-brand"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-lg border border-border-subtle text-xs">
            {["all", "UPI", "Card", "NetBanking"].map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={clsx(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize",
                  selectedMode === mode
                    ? "bg-brand text-white font-semibold shadow-xs"
                    : "text-text-muted hover:text-text-secondary"
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
            className="px-2.5 py-1 rounded-lg bg-surface-elevated text-xs font-ui text-text-secondary border border-border-subtle focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="debit">Debits Only</option>
            <option value="credit">Credits Only</option>
          </select>
        </div>
      </div>

      {/* Grouped Transaction List */}
      <div className="flex flex-col gap-6">
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm font-ui bg-surface/30">
            No transactions match your search filter
          </div>
        ) : (
          Object.entries(groupedByDate).map(([dateStr, items]) => (
            <div key={dateStr} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider">
                  {dateStr === new Date().toISOString().split("T")[0] ? "Today" : dateStr}
                </span>
                <span className="text-[11px] font-mono text-text-muted">
                  {items.length} transactions
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((tx) => {
                  const isCredit = tx.type === "credit";

                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-xl bg-surface border border-border-subtle hover:border-brand/30 transition-all duration-150 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={clsx(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                            isCredit
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          )}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-rose-400" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-text-primary truncate">
                            {tx.merchant || tx.description}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              {getModeIcon(tx.payment_mode)}
                              {tx.payment_mode}
                            </span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-surface-elevated text-[10px] font-mono">
                              {tx.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span
                          className={clsx(
                            "text-sm font-bold block",
                            isCredit ? "text-emerald-400" : "text-text-primary"
                          )}
                        >
                          {isCredit ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                        </span>
                        <span className="text-[10px] text-text-muted uppercase font-mono">
                          {tx.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
