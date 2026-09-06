"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Archive, Star, Clock, Sparkles, ExternalLink, Paperclip, CheckCircle2 } from "lucide-react";
import { EmailItem } from "@/types";

interface EmailDetailProps {
  email: EmailItem | null;
  onClose: () => void;
  onArchive?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onStar?: (id: string) => void;
}

export function EmailDetail({
  email,
  onClose,
  onArchive,
  onSnooze,
  onStar,
}: EmailDetailProps) {
  if (!email) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
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
          className="relative w-full md:w-[600px] h-[85vh] md:h-full bg-surface border-t md:border-l border-border-subtle rounded-t-2xl md:rounded-none flex flex-col z-10 shadow-2xl overflow-hidden mt-auto md:mt-0"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => email && onArchive?.(email.id)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                title="Archive"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => email && onSnooze?.(email.id)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                title="Snooze"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={() => email && onStar?.(email.id)}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                title="Star"
              >
                <Star className="w-4 h-4" />
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
            <h1 className="text-xl font-bold font-ui text-text-primary leading-tight">
              {email.subject}
            </h1>

            {/* Sender Metadata */}
            <div className="flex items-center justify-between py-3 border-y border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-subtle text-brand border border-brand/20 flex items-center justify-center font-bold font-ui text-sm">
                  {email.sender.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-text-primary">{email.sender}</div>
                  <div className="text-xs text-text-muted">{email.email}</div>
                </div>
              </div>
              <div className="text-xs text-text-muted font-mono">{email.date}</div>
            </div>

            {/* AI Summary Banner (if available) */}
            <div className="p-4 rounded-xl bg-brand-subtle/50 border border-brand/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">
                  AI Summary & Action Brief
                </div>
                <p className="text-sm text-text-primary italic leading-relaxed">
                  {email.snippet}
                </p>
              </div>
            </div>

            {/* Action Item Box (if urgent/has action) */}
            {email.isUrgent && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Action Item Required</span>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors">
                  Complete
                </button>
              </div>
            )}

            {/* Email Body text */}
            <div className="prose prose-invert max-w-none text-sm text-text-secondary leading-relaxed font-sans whitespace-pre-wrap">
              {email.snippet}
            </div>

            {/* Attachments Section */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-xs font-semibold text-text-muted uppercase mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachments ({email.attachments.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {email.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-xs text-text-primary"
                    >
                      <span>{att}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
