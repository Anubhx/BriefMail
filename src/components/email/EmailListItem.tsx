"use client";

import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Archive, Trash2, Star } from "lucide-react";

export interface EmailListItemProps {
  id: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  sender?: string;
  snippet: string;
  date?: string;
  receivedAt?: Date;
  category: string;
  subcategory?: string;
  isRead?: boolean;
  isUnread?: boolean;
  hasActionItem?: boolean;
  isSelected?: boolean;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onStar?: (id: string) => void;
  onClick?: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_FULL = 120;

export function EmailListItem({
  id,
  subject,
  fromName,
  sender,
  snippet,
  date,
  receivedAt,
  category,
  isRead = false,
  isUnread,
  hasActionItem = false,
  isSelected = false,
  onArchive,
  onDelete,
  onSnooze,
  onStar,
  onClick,
}: EmailListItemProps) {
  const displayName = sender || fromName || "Unknown";
  const displayDate = date || (receivedAt ? new Date(receivedAt).toLocaleDateString() : "");
  const unreadState = isUnread !== undefined ? isUnread : !isRead;
  const x = useMotionValue(0);

  // Left swipe → archive (negative x)
  const archiveOpacity = useTransform(x, [-SWIPE_FULL, -SWIPE_THRESHOLD], [1, 0]);
  const archiveScale = useTransform(x, [-SWIPE_FULL, -SWIPE_THRESHOLD], [1, 0.7]);

  // Right swipe → star (positive x)
  const starOpacity = useTransform(x, [SWIPE_THRESHOLD, SWIPE_FULL], [0, 1]);
  const starScale = useTransform(x, [SWIPE_THRESHOLD, SWIPE_FULL], [0.7, 1]);

  function handleDragEnd() {
    const current = x.get();
    if (current < -SWIPE_THRESHOLD) {
      onArchive?.(id);
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    } else if (current > SWIPE_THRESHOLD) {
      onStar?.(id);
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }

  const formattedTime = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(receivedAt);

  const CATEGORY_COLORS: Record<string, string> = {
    finance: "bg-emerald-500/20 text-emerald-400",
    investments: "bg-blue-500/20 text-blue-400",
    jobs: "bg-violet-500/20 text-violet-400",
    career: "bg-purple-500/20 text-purple-400",
    meetings: "bg-amber-500/20 text-amber-400",
    system: "bg-slate-500/20 text-slate-400",
    offers: "bg-pink-500/20 text-pink-400",
    social: "bg-cyan-500/20 text-cyan-400",
    misc: "bg-gray-500/20 text-gray-400",
  };

  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.misc;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background action layers */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        {/* Left: Archive */}
        <motion.div
          style={{ opacity: archiveOpacity, scale: archiveScale }}
          className="flex items-center gap-2 text-blue-400"
        >
          <Archive className="w-5 h-5" />
          <span className="text-xs font-ui font-semibold">Archive</span>
        </motion.div>

        {/* Right: Star */}
        <motion.div
          style={{ opacity: starOpacity, scale: starScale }}
          className="flex items-center gap-2 text-amber-400"
        >
          <span className="text-xs font-ui font-semibold">Star</span>
          <Star className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Draggable row */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -SWIPE_FULL, right: SWIPE_FULL }}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClick={() => onClick?.(id)}
        className="relative z-10 flex items-start gap-3 px-4 py-3.5 bg-surface hover:bg-surface-elevated cursor-pointer select-none transition-colors"
        whileTap={{ scale: 0.99 }}
      >
        {/* Unread indicator */}
        <div className="mt-1.5 shrink-0">
          {unreadState ? (
            <span className="w-2 h-2 rounded-full bg-brand block" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-transparent block" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={`text-sm font-ui truncate ${
                !unreadState ? "text-text-secondary font-normal" : "text-text-primary font-semibold"
              }`}
            >
              {displayName}
            </span>
            <span className="text-xs text-text-muted font-mono shrink-0">{displayDate || formattedTime}</span>
          </div>

          <p
            className={`text-sm truncate mb-1 ${
              !unreadState ? "text-text-muted" : "text-text-secondary font-medium"
            }`}
          >
            {subject}
          </p>

          <p className="text-xs text-text-muted truncate">{snippet}</p>

          {/* Metadata chips */}
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui font-medium ${categoryColor}`}
            >
              {category}
            </span>

            {hasActionItem && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                Action needed
              </span>
            )}
          </div>
        </div>

        {/* Delete button (long-press area — Phase 6 will wire context menu) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(id);
          }}
          className="shrink-0 mt-1 p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete email"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
}
