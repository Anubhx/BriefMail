"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  Building2,
  PieChart,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";

import { OverviewCards } from "@/components/finance/OverviewCards";
import { EMITimeline } from "@/components/finance/EMITimeline";
import { SIPDashboard } from "@/components/finance/SIPDashboard";
import { TransactionList } from "@/components/finance/TransactionList";
import { SubscriptionsList } from "@/components/finance/SubscriptionsList";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "emi", label: "EMI Tracker", icon: Building2 },
  { id: "investments", label: "Investments", icon: PieChart },
  { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch summary data from API endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const res = await fetch("/api/finance/summary");
      if (!res.ok) throw new Error("Failed to load finance data");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full font-ui select-none">
      {/* Finance Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-b border-border-subtle bg-surface/40 backdrop-blur-md sticky top-0 z-20">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-ui transition-colors duration-150 outline-none shrink-0",
                isActive
                  ? "text-text-primary font-semibold"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated/40"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFinanceTabPill"
                  className="absolute inset-0 bg-brand-subtle border border-brand/30 rounded-xl shadow-xs"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              <Icon
                className={clsx(
                  "w-4 h-4 relative z-10 transition-colors",
                  isActive ? "text-brand" : "text-text-muted"
                )}
              />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Section Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              <OverviewCards data={data?.overview} isLoading={isLoading} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted mb-3">
                    Upcoming Liabilities & EMIs
                  </h3>
                  <EMITimeline
                    items={data?.emi_tracker?.items}
                    totalOutstanding={data?.emi_tracker?.total_outstanding}
                  />
                </div>

                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted mb-3">
                    Recent Transactions
                  </h3>
                  <TransactionList transactions={data?.transactions?.slice(0, 4)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <TransactionList transactions={data?.transactions} />
          )}

          {activeTab === "emi" && (
            <EMITimeline
              items={data?.emi_tracker?.items}
              totalOutstanding={data?.emi_tracker?.total_outstanding}
            />
          )}

          {activeTab === "investments" && (
            <SIPDashboard
              sips={data?.investments?.sips}
              totalValue={data?.investments?.total_portfolio_value}
              totalInvested={data?.investments?.total_invested}
              overallReturnsPct={data?.investments?.overall_returns_pct}
            />
          )}

          {activeTab === "subscriptions" && (
            <SubscriptionsList subscriptions={data?.subscriptions} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
