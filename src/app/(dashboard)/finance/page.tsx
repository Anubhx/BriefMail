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

const FALLBACK_FINANCE_DATA = {
  overview: {
    total_debits: 0,
    total_credits: 0,
    total_debits_this_month: 0,
    total_credits_this_month: 0,
    next_emi: null,
    active_sips_total: 0,
    has_data: false,
  },
  transactions: [],
  emi_tracker: [],
  sip_investments: [],
  investments: {
    has_data: false,
    total_portfolio_value: 0,
    total_invested: 0,
    overall_returns_pct: 0,
    sips: [],
  },
  subscriptions: [],
  has_data: false,
};

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch summary data from API endpoint
  const { data, isLoading } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/finance/summary");
        if (!res.ok) {
          return FALLBACK_FINANCE_DATA;
        }
        const json = await res.json();
        return json ?? FALLBACK_FINANCE_DATA;
      } catch (err) {
        console.error("Failed to load finance data:", err);
        return FALLBACK_FINANCE_DATA;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const emiItems = Array.isArray(data?.emi_tracker)
    ? data.emi_tracker
    : (data?.emi_tracker?.items ?? []);
  const emiTotalOutstanding = Array.isArray(data?.emi_tracker)
    ? undefined
    : data?.emi_tracker?.total_outstanding;

  const transactions = data?.transactions ?? [];

  const sips =
    Array.isArray(data?.sip_investments) && data.sip_investments.length > 0
      ? data.sip_investments
      : (data?.investments?.sips ?? (Array.isArray(data?.sip_investments) ? data.sip_investments : []));

  const totalPortfolioValue = data?.investments?.total_portfolio_value ?? 0;
  const totalInvested = data?.investments?.total_invested ?? 0;
  const overallReturnsPct = data?.investments?.overall_returns_pct ?? 0;

  const subscriptions = data?.subscriptions ?? [];

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
                    items={emiItems}
                    totalOutstanding={emiTotalOutstanding}
                  />
                </div>

                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted mb-3">
                    Recent Transactions
                  </h3>
                  <TransactionList transactions={(transactions ?? []).slice(0, 4)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <TransactionList transactions={transactions} />
          )}

          {activeTab === "emi" && (
            <EMITimeline
              items={emiItems}
              totalOutstanding={emiTotalOutstanding}
            />
          )}

          {activeTab === "investments" && (
            <SIPDashboard
              sips={sips}
              totalValue={totalPortfolioValue}
              totalInvested={totalInvested}
              overallReturnsPct={overallReturnsPct}
            />
          )}

          {activeTab === "subscriptions" && (
            <SubscriptionsList subscriptions={subscriptions} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
