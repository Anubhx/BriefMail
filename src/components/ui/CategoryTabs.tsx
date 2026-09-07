"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export interface CategoryTabItem {
  id: string;
  label: string;
  count?: number;
}

const CATEGORIES: CategoryTabItem[] = [
  { id: "all", label: "All" },
  { id: "finance", label: "Finance" },
  { id: "jobs", label: "Jobs" },
  { id: "career", label: "Career" },
  { id: "investments", label: "Investments" },
  { id: "meetings", label: "Meetings" },
  { id: "social", label: "Social" },
  { id: "newsletter", label: "Newsletter" },
  { id: "otp", label: "OTP" },
  { id: "finance_transaction", label: "Transactions" },
  { id: "system", label: "System" },
];

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categoryCounts?: Record<string, number>;
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  categoryCounts = {},
}: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar border-b border-border bg-surface select-none">
      <div className="flex items-center gap-5 px-4 min-w-max h-11">
        {CATEGORIES.map((tab) => {
          const isActive = activeCategory.toLowerCase() === tab.id.toLowerCase();
          const count = categoryCounts[tab.id] ?? tab.count ?? 0;

          return (
            <button
              key={tab.id}
              onClick={() => onCategoryChange(tab.id)}
              className={clsx(
                "relative flex items-center gap-1.5 h-full px-1 text-xs font-ui transition-colors duration-150 outline-none uppercase tracking-wider",
                isActive
                  ? "text-brand font-semibold"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              <span>{tab.label}</span>

              {count > 0 && (
                <span
                  className={clsx(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono leading-none transition-colors",
                    isActive
                      ? "bg-brand/10 text-brand font-semibold"
                      : "bg-surface-subtle text-text-muted"
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}

              {/* 2px orange bottom underline for active state */}
              {isActive && (
                <motion.div
                  layoutId="categoryActiveUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

