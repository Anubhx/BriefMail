"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ActionCardProps {
  title: string;
  badge?: string;
  timestamp: string;
  snippet: string;
  isUrgent?: boolean;
  onClick?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  badge,
  timestamp,
  snippet,
  isUrgent,
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl bg-surface p-4",
        "border border-border-subtle hover:border-border-strong",
        "shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200"
      )}
    >
      {isUrgent && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand" />
      )}

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          {badge && (
            <span className="font-ui text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-subtle text-brand-hover border border-brand/20">
              {badge}
            </span>
          )}
          <h4 className="font-ui text-sm font-semibold text-text-primary tracking-tight truncate max-w-[200px]">
            {title}
          </h4>
        </div>
        <span className="font-ui text-xs text-text-muted shrink-0">
          {timestamp}
        </span>
      </div>

      <p className="font-body text-sm text-text-secondary line-clamp-2 leading-normal">
        {snippet}
      </p>
    </motion.div>
  );
};
