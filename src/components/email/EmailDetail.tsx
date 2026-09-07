"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Archive,
  Star,
  Clock,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

export interface LiveEmailDetail {
  id: string;
  subject: string;
  from_name?: string | null;
  from_email?: string | null;
  sender?: string;
  email?: string;
  snippet?: string;
  body_text?: string | null;
  body_html?: string | null;
  received_at?: string | Date;
  date?: string;
  category?: string;
  subcategory?: string;
  classification_tier?: string;
  confidence_score?: number;
  ai_summary?: string | null;
  action_items?: Array<{ type?: string; description: string; due_date?: string }> | null;
  has_action_item?: boolean;
  is_read?: boolean;
  is_starred?: boolean;
  is_archived?: boolean;
  is_snoozed?: boolean;
  snoozed_until?: string | null;
  snooze_until?: string | null;
  attachments?: any[];
}

function addTargetBlank(html: string): string {
  return html.replace(
    /<a\s/gi,
    '<a target="_blank" rel="noopener noreferrer" '
  );
}

interface EmailDetailProps {
  email: LiveEmailDetail | null;
  onClose: () => void;
  onArchive?: (id: string) => void;
  onSnooze?: (id: string, snoozeUntil: string) => void;
  onStar?: (id: string, isStarred: boolean) => void;
}

export function EmailDetail({
  email,
  onClose,
  onArchive,
  onSnooze,
  onStar,
}: EmailDetailProps) {
  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  if (!email) return null;

  const displayName = email.from_name || email.sender || email.from_email || "Unknown";
  const displayEmail = email.from_email || email.email || "";
  const displayDate = email.received_at
    ? isValid(typeof email.received_at === "string" ? parseISO(email.received_at) : email.received_at)
      ? format(
          typeof email.received_at === "string" ? parseISO(email.received_at) : email.received_at,
          "EEE, MMM d, yyyy • h:mm a"
        )
      : String(email.date || "")
    : email.date || "";

  const actionItems = Array.isArray(email.action_items) ? email.action_items : [];

  const handleSnoozeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snoozeDate) return;
    onSnooze?.(email.id, new Date(snoozeDate).toISOString());
    setShowSnoozePicker(false);
  };

  const handleQuickSnooze = (hours: number) => {
    const target = new Date(Date.now() + hours * 60 * 60 * 1000);
    onSnooze?.(email.id, target.toISOString());
    setShowSnoozePicker(false);
  };

  const toggleActionItem = (idx: number) => {
    setCompletedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-background bg-white dark:bg-gray-900 md:bg-black/40 md:backdrop-blur-xs overflow-hidden">
        {/* Backdrop dismiss on tablet/desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="hidden md:block absolute inset-0"
        />

        {/* Panel Container — Full screen takeover on Mobile with solid background, slide-over on Desktop */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="relative w-full md:max-w-2xl lg:max-w-3xl h-full bg-background bg-white dark:bg-gray-900 flex flex-col z-50 shadow-elevation-3 overflow-hidden"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Top Sticky Header Actions */}
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border bg-background bg-white dark:bg-gray-900 shrink-0 z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                aria-label="Back to inbox"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-ui font-medium">Back</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => email && onStar?.(email.id, !email.is_starred)}
                className={`p-2 rounded-md transition-colors ${
                  email.is_starred
                    ? "text-amber-600 hover:text-amber-700"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-subtle"
                }`}
                title={email.is_starred ? "Unstar" : "Star"}
              >
                <Star className={`w-4 h-4 ${email.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSnoozePicker(!showSnoozePicker)}
                  className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                  title="Snooze"
                >
                  <Clock className="w-4 h-4" />
                </button>

                {/* Snooze Dropdown */}
                {showSnoozePicker && (
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-surface border border-border-strong shadow-elevation-2 z-30 space-y-2">
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block font-ui">
                      Snooze Until
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-ui">
                      <button
                        onClick={() => handleQuickSnooze(3)}
                        className="p-2 rounded bg-surface-subtle hover:bg-surface-secondary text-text-secondary text-left transition-colors"
                      >
                        In 3 hours
                      </button>
                      <button
                        onClick={() => handleQuickSnooze(24)}
                        className="p-2 rounded bg-surface-subtle hover:bg-surface-secondary text-text-secondary text-left transition-colors"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => handleQuickSnooze(72)}
                        className="p-2 rounded bg-surface-subtle hover:bg-surface-secondary text-text-secondary text-left col-span-2 transition-colors"
                      >
                        This Weekend
                      </button>
                    </div>

                    <form onSubmit={handleSnoozeSubmit} className="pt-2 border-t border-border space-y-2 font-ui">
                      <label className="text-[10px] text-text-muted block">Custom date & time</label>
                      <input
                        type="datetime-local"
                        required
                        value={snoozeDate}
                        onChange={(e) => setSnoozeDate(e.target.value)}
                        className="w-full rounded border border-border bg-surface p-1.5 text-xs text-text-primary focus:outline-none focus:border-brand"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors"
                      >
                        Snooze
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <button
                onClick={() => email && onArchive?.(email.id)}
                className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                title="Archive Email"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reading Canvas */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-10 py-6 sm:py-8 space-y-7 bg-background bg-white dark:bg-gray-900">
            {/* Subject - Editorial Headline */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {email.category && (
                  <span className="text-[11px] font-ui font-medium uppercase tracking-wider text-brand">
                    {email.category.replace("_", " ")}
                  </span>
                )}
                {email.subcategory && (
                  <span className="text-[11px] font-mono text-text-muted uppercase">
                    • {email.subcategory}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl text-text-primary font-normal leading-tight tracking-tight">
                {email.subject || "(No subject)"}
              </h1>
            </div>

            {/* Sender & Recipient Metadata */}
            <div className="flex items-start justify-between gap-4 py-4 border-y border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface-subtle border border-border text-text-secondary flex items-center justify-center font-ui font-semibold text-xs uppercase shrink-0">
                  {displayName.charAt(0)}
                </div>
                <div>
                  <div className="font-ui font-semibold text-sm text-text-primary">
                    {displayName}
                  </div>
                  {displayEmail && (
                    <div className="font-mono text-xs text-text-muted">{displayEmail}</div>
                  )}
                </div>
              </div>
              <div className="font-mono text-xs text-text-muted shrink-0 pt-1">
                {displayDate}
              </div>
            </div>

            {/* AI Summary - Restrained parchment note */}
            {email.ai_summary && (
              <div className="p-4 rounded border-l-2 border-brand bg-surface-secondary space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-ui font-semibold uppercase tracking-wider text-brand">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Summary</span>
                </div>
                <p className="font-serif italic text-sm text-text-secondary leading-relaxed">
                  {email.ai_summary}
                </p>
              </div>
            )}

            {/* Action Items Checklist */}
            {(email.has_action_item || actionItems.length > 0) && (
              <div className="rounded border border-border bg-surface-secondary p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-ui font-semibold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    Action Items
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {actionItems.length} item{actionItems.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {actionItems.map((item, idx) => {
                    const isDone = !!completedItems[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleActionItem(idx)}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                          isDone
                            ? "text-text-muted line-through"
                            : "text-text-secondary hover:bg-surface-subtle"
                        }`}
                      >
                        {isDone ? (
                          <CheckSquare className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs font-ui flex-1">
                          <p className={isDone ? "line-through text-text-muted" : "text-text-primary font-medium"}>
                            {item.description}
                          </p>
                          {item.due_date && (
                            <span className="text-[10px] font-mono text-amber-700 block mt-0.5">
                              Due: {item.due_date}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Long-form Email Body */}
            <div className="pt-2 text-text-primary leading-relaxed max-w-prose">
              {email.body_html ? (
                <div
                  className="prose prose-neutral max-w-none text-[15px] sm:text-base leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: addTargetBlank(email.body_html) }}
                />
              ) : email.body_text ? (
                <div className="font-ui text-[15px] sm:text-base whitespace-pre-wrap leading-relaxed text-text-primary">
                  {email.body_text}
                </div>
              ) : (
                <div className="text-sm text-text-muted italic leading-relaxed">
                  {email.snippet || "No preview body content available."}
                </div>
              )}
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="pt-6 border-t border-border space-y-3">
                <div className="text-xs font-ui font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({email.attachments.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {email.attachments.map((att: any, idx: number) => {
                    const name = typeof att === "string" ? att : att.name || `Attachment ${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-surface text-xs font-ui text-text-primary hover:border-border-strong transition-colors"
                      >
                        <span className="truncate max-w-[220px]">{name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

