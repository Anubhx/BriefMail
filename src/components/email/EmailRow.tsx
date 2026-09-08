"use client";

import React from "react";
import { EmailItem } from "@/types";
import { clsx } from "clsx";

interface EmailRowProps {
  email: EmailItem;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "briefmail-list-item group relative cursor-pointer p-4 rounded-xl transition-all duration-200 border",
        isSelected
          ? "bg-surface-elevated border-brand/40 shadow-elevation-2"
          : email.isUnread
          ? "bg-brand/[0.04] border-border hover:border-border-strong hover:bg-brand/[0.07]"
          : "bg-surface border-border-subtle hover:border-border-strong hover:bg-surface-elevated/50"
      )}
    >
      {email.isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand rounded-l-xl" />
      )}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {email.isUnread && (
            <span className="w-2 h-2 rounded-full bg-brand shrink-0" title="Unread" />
          )}
          <span className={clsx("text-sm font-ui", email.isUnread ? "font-bold text-text-primary" : "font-medium text-text-secondary")}>
            {email.sender}
          </span>
        </div>
        <span className="text-xs font-mono text-text-muted">{email.date}</span>
      </div>
      <h4 className={clsx("text-sm font-ui mb-1 truncate", email.isUnread ? "font-semibold text-text-primary" : "text-text-secondary")}>
        {email.subject}
      </h4>
      <p className="text-xs font-body text-text-muted line-clamp-1">{email.snippet}</p>
    </div>
  );
};
