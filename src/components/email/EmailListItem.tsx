"use client";

import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Archive, Star, CheckSquare } from "lucide-react";
import { clsx } from "clsx";

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

const SWIPE_THRESHOLD = 70;
const SWIPE_FULL = 110;

// Editorial soft category palette
const CATEGORY_DOT_COLORS: Record<string, string> = {
  finance: "#2FA66A",
  finance_transaction: "#2FA66A",
  career: "#4267D5",
  jobs: "#4267D5",
  meetings: "#8B5CC7",
  investments: "#D58A00",
  social: "#D64F7A",
  newsletter: "#309BA8",
  otp: "#E46C2E",
  system: "#777A80",
  ads: "#D64F7A",
  misc: "#777A80",
};

export function EmailListItem({
  id,
  subject,
  fromName,
  sender,
  snippet,
  date,
  receivedAt,
  category,
  subcategory,
  isRead = false,
  isUnread,
  hasActionItem = false,
  isSelected = false,
  onArchive,
  onStar,
  onClick,
}: EmailListItemProps) {
  const displayName = sender || fromName || "Unknown";
  const displayDate = date || (receivedAt ? new Date(receivedAt).toLocaleDateString() : "");
  const unreadState = isUnread !== undefined ? isUnread : !isRead;
  const x = useMotionValue(0);

  // Swipe transforms
  const archiveOpacity = useTransform(x, [-SWIPE_FULL, -SWIPE_THRESHOLD], [1, 0]);
  const starOpacity = useTransform(x, [SWIPE_THRESHOLD, SWIPE_FULL], [0, 1]);

  function handleDragEnd() {
    const current = x.get();
    if (current < -SWIPE_THRESHOLD) {
      onArchive?.(id);
      animate(x, 0, { type: "spring", stiffness: 350, damping: 30 });
    } else if (current > SWIPE_THRESHOLD) {
      onStar?.(id);
      animate(x, 0, { type: "spring", stiffness: 350, damping: 30 });
    } else {
      animate(x, 0, { type: "spring", stiffness: 350, damping: 30 });
    }
  }

  const formattedTime = receivedAt
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(receivedAt)
    : "";

  const dotColor = CATEGORY_DOT_COLORS[category.toLowerCase()] || CATEGORY_DOT_COLORS.misc;

  return (
    <div
      className={clsx(
        "briefmail-list-item relative overflow-hidden border-b border-border transition-colors duration-150 select-none group",
        isSelected
          ? "bg-surface-secondary"
          : "bg-surface hover:bg-surface-subtle"
      )}
    >
      {/* 3px Orange Left Indicator when Selected */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand z-20" />
      )}

      {/* Swipe reveal background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none z-0">
        {/* Left swipe → Star */}
        <motion.div
          style={{ opacity: starOpacity }}
          className="flex items-center gap-1.5 text-amber-600"
        >
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="text-xs font-ui font-medium">Star</span>
        </motion.div>

        {/* Right swipe → Archive */}
        <motion.div
          style={{ opacity: archiveOpacity }}
          className="flex items-center gap-1.5 text-text-muted"
        >
          <span className="text-xs font-ui font-medium">Archive</span>
          <Archive className="w-4 h-4 text-text-muted" />
        </motion.div>
      </div>

      {/* Draggable Row Body */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -SWIPE_FULL, right: SWIPE_FULL }}
        dragElastic={0.12}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onClick={() => onClick?.(id)}
        className="relative z-10 flex items-start gap-3 px-4 py-3.5 cursor-pointer bg-inherit"
      >
        {/* Unread dot or placeholder */}
        <div className="pt-1 shrink-0 w-2 flex items-center justify-center">
          {unreadState ? (
            <span
              className="w-2 h-2 rounded-full bg-brand shrink-0"
              title="Unread"
            />
          ) : (
            <span className="w-2 h-2 rounded-full bg-transparent shrink-0" />
          )}
        </div>

        {/* Row Content */}
        <div className="flex-1 min-w-0">
          {/* Sender & Timestamp */}
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span
              className={clsx(
                "text-sm font-ui truncate",
                unreadState
                  ? "text-text-primary font-semibold"
                  : "text-text-secondary font-normal"
              )}
            >
              {displayName}
            </span>
            <span className="text-[11px] font-mono text-text-muted shrink-0">
              {displayDate || formattedTime}
            </span>
          </div>

          {/* Subject */}
          <h4
            className={clsx(
              "text-sm truncate mb-0.5 font-ui",
              unreadState
                ? "text-text-primary font-medium"
                : "text-text-secondary font-normal"
            )}
          >
            {subject || "(No subject)"}
          </h4>

          {/* Preview Snippet */}
          <p className="text-xs text-text-muted truncate leading-relaxed">
            {snippet || ""}
          </p>

          {/* Metadata Footer: Quiet Category Dot & Action items */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <span className="text-[11px] font-ui text-text-muted capitalize">
                {category.replace("_", " ")}
              </span>
            </div>

            {subcategory && (
              <span className="text-[10px] font-mono text-text-muted uppercase">
                • {subcategory}
              </span>
            )}

            {hasActionItem && (
              <span className="inline-flex items-center gap-1 text-[10px] font-ui font-medium text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                <CheckSquare className="w-3 h-3" />
                Action
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

