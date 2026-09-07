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
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-border-subtle bg-surface/40 backdrop-blur-md sticky top-0 z-20 select-none">
      <div className="flex items-center gap-1.5 px-4 min-w-max">
        {CATEGORIES.map((tab) => {
          const isActive = activeCategory.toLowerCase() === tab.id.toLowerCase();
          const count = categoryCounts[tab.id] ?? tab.count ?? 0;

          return (
            <button
              key={tab.id}
              onClick={() => onCategoryChange(tab.id)}
              className={clsx(
                "relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-ui transition-colors duration-150 outline-none",
                isActive
                  ? "text-text-primary font-semibold"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated/40"
              )}
            >
              {/* Sliding animated background pill */}
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-brand-subtle border border-brand/30 rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              <span className="relative z-10">{tab.label}</span>

              {count > 0 && (
                <span
                  className={clsx(
                    "relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none transition-colors",
                    isActive
                      ? "bg-brand text-white font-bold"
                      : "bg-surface-elevated text-text-muted"
                  )}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
