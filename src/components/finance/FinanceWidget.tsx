"use client";

import React from "react";
import { ActionCard } from "@/components/ui/ActionCard";

export const FinanceWidget: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-ui text-xs font-semibold uppercase tracking-wider text-text-muted">
        Financial Invoices & Subscriptions
      </h3>
      <ActionCard
        title="Stripe Billing - Pro Plan"
        badge="Debit"
        timestamp="Today"
        snippet="Monthly receipt of $49.00 processed for BriefMail workspace."
        isUrgent={false}
      />
      <ActionCard
        title="Client Invoice #1094"
        badge="Credit"
        timestamp="Yesterday"
        snippet="Payment of $2,450.00 received from Acme Corp for Q3 consulting."
        isUrgent={true}
      />
    </div>
  );
};
