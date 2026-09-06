"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Archive,
  Star,
  Clock,
  Sparkles,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  Calendar,
  CheckSquare,
  Square,
  Tag,
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
  attachments?: any[];
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
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Panel Container — Bottom Sheet on Mobile, Right Panel on Desktop */}
        <motion.div
          initial={{ y: "100%", x: 0 }}
          animate={{ y: 0, x: 0 }}
          exit={{ y: "100%", x: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="relative w-full md:w-[640px] h-[90vh] md:h-full bg-surface border-t md:border-l border-border-subtle rounded-t-2xl md:rounded-none flex flex-col z-10 shadow-2xl overflow-hidden mt-auto md:mt-0 font-ui"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => email && onArchive?.(email.id)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                title="Archive Email"
              >
                <Archive className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSnoozePicker(!showSnoozePicker)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                  title="Snooze"
                >
                  <Clock className="w-4 h-4" />
                </button>

                {/* Snooze Dropdown */}
                {showSnoozePicker && (
                  <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-xl bg-surface-elevated border border-white/10 shadow-2xl z-30 space-y-2 animate-in fade-in zoom-in-95">
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                      Snooze Until
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        onClick={() => handleQuickSnooze(3)}
                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-overlay text-text-secondary text-left"
                      >
                        In 3 hours
                      </button>
                      <button
                        onClick={() => handleQuickSnooze(24)}
                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-overlay text-text-secondary text-left"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => handleQuickSnooze(72)}
                        className="p-1.5 rounded-lg bg-surface hover:bg-surface-overlay text-text-secondary text-left col-span-2"
                      >
                        This Weekend
                      </button>
                    </div>

                    <form onSubmit={handleSnoozeSubmit} className="pt-2 border-t border-white/5 space-y-2">
                      <label className="text-[10px] text-text-muted block">Custom date & time</label>
                      <input
                        type="datetime-local"
                        required
                        value={snoozeDate}
                        onChange={(e) => setSnoozeDate(e.target.value)}
                        className="w-full rounded-md bg-surface border border-white/10 p-1.5 text-xs text-text-primary focus:outline-none focus:border-brand"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold"
                      >
                        Snooze
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <button
                onClick={() => email && onStar?.(email.id, !email.is_starred)}
                className={`p-2 rounded-lg transition-colors ${
                  email.is_starred
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
                }`}
                title={email.is_starred ? "Unstar" : "Star"}
              >
                <Star className={`w-4 h-4 ${email.is_starred ? "fill-amber-400" : ""}`} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Email Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {email.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-subtle text-brand border border-brand/20">
                    <Tag className="h-3 w-3" />
                    {email.category}
                  </span>
                )}
                {email.subcategory && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-elevated text-text-muted border border-white/5 uppercase">
                    {email.subcategory}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold font-ui text-text-primary leading-tight">
                {email.subject}
              </h1>
            </div>

            {/* Sender Metadata */}
            <div className="flex items-center justify-between py-3 border-y border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-subtle text-brand border border-brand/20 flex items-center justify-center font-bold font-ui text-sm uppercase">
                  {displayName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm text-text-primary">{displayName}</div>
                  {displayEmail && <div className="text-xs text-text-muted">{displayEmail}</div>}
                </div>
              </div>
              <div className="text-xs text-text-muted font-mono">{displayDate}</div>
            </div>

            {/* AI Summary Banner (Amber / Brand card) */}
            {email.ai_summary && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    AI Summary
                  </div>
                  <p className="text-sm text-text-primary italic leading-relaxed">
                    {email.ai_summary}
                  </p>
                </div>
              </div>
            )}

            {/* Action Items Checklist */}
            {(email.has_action_item || actionItems.length > 0) && (
              <div className="rounded-xl bg-surface-elevated/40 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Action Items Required
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {actionItems.length} item{actionItems.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-2">
                  {actionItems.map((item, idx) => {
                    const isDone = !!completedItems[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleActionItem(idx)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/20 text-text-muted line-through"
                            : "bg-surface-base border-white/5 text-text-secondary hover:border-white/15"
                        }`}
                      >
                        {isDone ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs flex-1">
                          <p className={isDone ? "line-through text-text-muted" : "text-text-primary font-medium"}>
                            {item.description}
                          </p>
                          {item.due_date && (
                            <span className="text-[10px] text-amber-400 block mt-0.5">
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

            {/* Email Body text / HTML */}
            <div className="pt-2">
              {email.body_html ? (
                <div
                  className="prose prose-invert max-w-none text-sm text-text-secondary leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: email.body_html }}
                />
              ) : email.body_text ? (
                <div className="prose prose-invert max-w-none text-sm text-text-secondary leading-relaxed font-sans whitespace-pre-wrap">
                  {email.body_text}
                </div>
              ) : (
                <div className="text-sm text-text-muted italic leading-relaxed">
                  {email.snippet || "No preview body content available."}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-xs font-semibold text-text-muted uppercase mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({email.attachments.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {email.attachments.map((att: any, idx: number) => {
                    const name = typeof att === "string" ? att : att.name || `Attachment ${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-text-primary"
                      >
                        <span className="truncate max-w-[200px]">{name}</span>
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
