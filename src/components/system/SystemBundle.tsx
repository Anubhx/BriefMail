"use client";

import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  ExternalLink,
  Layers,
  Inbox,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";

export interface BundledEmail {
  id: string;
  subject: string;
  snippet?: string | null;
  from_name?: string | null;
  from_email?: string;
  received_at: string;
  is_read: boolean;
  category?: string;
  subcategory?: string;
}

interface SystemBundleProps {
  emails: BundledEmail[];
  unreadCount: number;
  onMarkAllRead: () => Promise<void>;
}

export const SystemBundle: React.FC<SystemBundleProps> = ({
  emails,
  unreadCount,
  onMarkAllRead,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMarking(true);
    try {
      await onMarkAllRead();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarking(false);
    }
  };

  const totalCount = emails.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-DEFAULT/80 backdrop-blur-md overflow-hidden transition-all duration-300 shadow-elevation-1">
      {/* Collapsed Header / Accordion Trigger */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-text-muted border border-white/5 shrink-0">
            <Layers className="h-5 w-5 text-sky-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-ui font-semibold text-sm sm:text-base text-text-primary">
                System & Low-Priority Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {totalCount} system notifications — workspace updates, digests, platform alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={marking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-overlay border border-white/10 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
              <span>{marking ? "Marking..." : "Mark all read"}</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-xs text-text-muted font-medium">
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded List */}
      {isExpanded && (
        <div className="border-t border-white/10 p-2 divide-y divide-white/5 max-h-[500px] overflow-y-auto">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No low-priority notifications bundled.
            </div>
          ) : (
            emails.map((email) => {
              let relTime = "";
              if (email.received_at && isValid(parseISO(email.received_at))) {
                relTime = formatDistanceToNow(parseISO(email.received_at), {
                  addSuffix: true,
                });
              }

              return (
                <div
                  key={email.id}
                  className={`p-3.5 rounded-xl transition-colors hover:bg-surface-elevated/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !email.is_read ? "bg-surface-elevated/20" : ""
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!email.is_read && (
                        <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                      )}
                      <span className="font-semibold text-xs text-text-primary font-ui truncate">
                        {email.from_name || email.from_email || "System Service"}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-surface-base text-text-muted border border-white/5">
                        {email.subcategory || "Digest"}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-text-secondary truncate">
                      {email.subject || "No Subject"}
                    </h4>

                    {email.snippet && (
                      <p className="text-[11px] text-text-disabled line-clamp-1">
                        {email.snippet}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] text-text-muted">{relTime}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
