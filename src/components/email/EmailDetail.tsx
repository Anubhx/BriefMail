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
  onClose?: () => void;
  onArchive?: (id: string) => void;
  onSnooze?: (id: string, snoozeUntil: string) => void;
  onStar?: (id: string, isStarred: boolean) => void;
  isInline?: boolean;
}

export function EmailDetail({
  email,
  onClose,
  onArchive,
  onSnooze,
  onStar,
  isInline = false,
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

  const body_html = email.body_html;
  const wrappedHtml = body_html
    ? `<div style="background:#ffffff;color:#111111;font-family:sans-serif;padding:16px;color-scheme:light;">${addTargetBlank(body_html)}</div>`
    : "";

  const detailContent = (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Top Sticky Header Actions (Light themed with border-b) */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-gray-200 bg-gray-50 shrink-0 z-10">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-200/70 transition-colors"
              aria-label="Back to inbox"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-medium font-ui">Back</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Star Button */}
          <button
            onClick={() => email && onStar?.(email.id, !email.is_starred)}
            className={`p-2 rounded-md border transition-colors ${
              email.is_starred
                ? "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
            title={email.is_starred ? "Unstar" : "Star"}
          >
            <Star className={`w-4 h-4 ${email.is_starred ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>

          {/* Snooze Button & Picker */}
          <div className="relative">
            <button
              onClick={() => setShowSnoozePicker(!showSnoozePicker)}
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              title="Snooze"
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Snooze Dropdown */}
            {showSnoozePicker && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-white border border-gray-200 shadow-xl z-30 space-y-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block font-ui">
                  Snooze Until
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-ui">
                  <button
                    onClick={() => handleQuickSnooze(3)}
                    className="p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-800 text-left transition-colors"
                  >
                    In 3 hours
                  </button>
                  <button
                    onClick={() => handleQuickSnooze(24)}
                    className="p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-800 text-left transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => handleQuickSnooze(72)}
                    className="p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-800 text-left col-span-2 transition-colors"
                  >
                    This Weekend
                  </button>
                </div>

                <form onSubmit={handleSnoozeSubmit} className="pt-2 border-t border-gray-200 space-y-2 font-ui">
                  <label className="text-[10px] text-gray-500 block">Custom date & time</label>
                  <input
                    type="datetime-local"
                    required
                    value={snoozeDate}
                    onChange={(e) => setSnoozeDate(e.target.value)}
                    className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs text-gray-900 focus:outline-none focus:border-brand"
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

          {/* Archive Button */}
          <button
            onClick={() => email && onArchive?.(email.id)}
            className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            title="Archive Email"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reading Canvas */}
      <div className="flex-1 overflow-y-auto bg-white text-gray-900">
        {/* Subject Area */}
        <div className="px-4 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1.5">
            {email.category && (
              <span className="text-[11px] font-ui font-semibold uppercase tracking-wider text-brand">
                {email.category.replace("_", " ")}
              </span>
            )}
            {email.subcategory && (
              <span className="text-[11px] font-mono text-gray-400 uppercase">
                • {email.subcategory}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug tracking-tight">
            {email.subject || "(No subject)"}
          </h2>
        </div>

        {/* Sender & Recipient Metadata */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-y border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 text-gray-700 flex items-center justify-center font-ui font-bold text-xs uppercase shrink-0">
              {displayName.charAt(0)}
            </div>
            <div>
              <div className="font-ui font-semibold text-sm text-gray-900">
                {displayName}
              </div>
              {displayEmail && (
                <div className="font-mono text-xs text-gray-500">{displayEmail}</div>
              )}
            </div>
          </div>
          <div className="font-mono text-xs text-gray-500 shrink-0 pt-0.5">
            {displayDate}
          </div>
        </div>

        {/* AI Summary - Amber Parchment Card */}
        {email.ai_summary && (
          <div className="mx-4 sm:mx-6 my-3 p-4 rounded-lg border border-amber-200 bg-amber-50 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-ui font-semibold uppercase tracking-wider text-amber-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Summary</span>
            </div>
            <p className="font-serif italic text-sm text-amber-900 leading-relaxed">
              {email.ai_summary}
            </p>
          </div>
        )}

        {/* Action Items Checklist */}
        {(email.has_action_item || actionItems.length > 0) && (
          <div className="mx-4 sm:mx-6 my-3 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-ui font-semibold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Action Items
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
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
                        ? "text-gray-400 line-through"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-xs font-ui flex-1">
                      <p className={isDone ? "line-through text-gray-400" : "text-gray-900 font-medium"}>
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

        {/* Long-form Email Body - Immediately following metadata/summaries */}
        <div className="px-4 sm:px-6 py-2 text-gray-900 leading-relaxed">
          {email.body_html ? (
            <div
              className="bg-white rounded-lg overflow-hidden text-gray-900"
              style={{ colorScheme: "light", backgroundColor: "white" }}
            >
              <div
                className="prose max-w-none text-[15px] sm:text-base leading-relaxed overflow-x-auto text-gray-900"
                dangerouslySetInnerHTML={{ __html: wrappedHtml }}
              />
            </div>
          ) : email.body_text ? (
            <div
              className="bg-white rounded-lg overflow-hidden p-4 text-gray-900 font-ui text-[15px] sm:text-base whitespace-pre-wrap leading-relaxed"
              style={{ colorScheme: "light", backgroundColor: "white" }}
            >
              {email.body_text}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic leading-relaxed py-3">
              {email.snippet || "No preview body content available."}
            </div>
          )}
        </div>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mx-4 sm:mx-6 my-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="text-xs font-ui font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attachments ({email.attachments.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att: any, idx: number) => {
                const name = typeof att === "string" ? att : att.name || `Attachment ${idx + 1}`;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-gray-200 bg-gray-50 text-xs font-ui text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <span className="truncate max-w-[220px]">{name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return detailContent;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white md:bg-black/40 md:backdrop-blur-xs flex justify-end">
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
          className="relative w-full md:max-w-2xl lg:max-w-3xl min-h-full md:h-full bg-white flex flex-col z-50 shadow-2xl overflow-hidden"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {detailContent}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
