import React from "react";
import { FinanceWidget } from "@/components/finance/FinanceWidget";

export default function FinancePage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ui text-xl font-bold text-text-primary">Finance Hub</h1>
          <p className="text-sm text-text-muted">Automated billing, debit tracking, and invoice receipts.</p>
        </div>
      </div>
      <FinanceWidget />
    </div>
  );
}
