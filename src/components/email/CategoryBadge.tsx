"use client";

import React from "react";
import { clsx } from "clsx";
import { CATEGORY_COLORS } from "@/lib/constants";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const normalized = (category || "misc").toLowerCase();
  const colorClass =
    CATEGORY_COLORS[normalized] ||
    CATEGORY_COLORS[normalized.replace(" ", "_")] ||
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize font-ui",
        colorClass,
        className
      )}
    >
      {category.replace("_", " ")}
    </span>
  );
}

export default CategoryBadge;
