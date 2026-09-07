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
    <div className="flex flex-col gap-5 max-w-7xl mx-auto h-full font-ui select-none pb-12">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-border-default">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-text-primary tracking-tight font-normal">
            Finance & Accounts
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Automated statement parsing, bank transactions, upcoming EMIs, and investments.
          </p>
        </div>

        {/* Finance Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 sm:pt-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "relative flex items-center gap-1.5 px-3 py-2 text-xs font-ui transition-colors duration-150 outline-none shrink-0",
                  isActive
                    ? "text-brand font-semibold"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <Icon
                  className={clsx(
                    "w-3.5 h-3.5 transition-colors",
                    isActive ? "text-brand" : "text-text-muted"
                  )}
                />
                <span>{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeFinanceTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
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
