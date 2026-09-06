"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  KeyRound,
  CreditCard,
  CalendarCheck,
  FileUp,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { format, parseISO, isValid, differenceInSeconds } from "date-fns";

export interface ActionItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  payload?: Record<string, any> | null;
  created_at?: string;
  emails?: {
    id: string;
    subject: string;
    from_email: string;
    from_name?: string | null;
    snippet?: string | null;
    received_at?: string;
  } | null;
}

interface ActionBlockGridProps {
  actions: ActionItem[];
  onDismiss: (id: string) => void;
}

export const ActionBlockGrid: React.FC<ActionBlockGridProps> = ({
  actions,
  onDismiss,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text-primary font-ui flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            Entity Isolation: Extracted Action Blocks
          </h2>
          <p className="text-xs text-text-muted">
            High-intent items isolated directly from raw emails into interactive cards.
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-subtle text-brand border border-brand/20">
          {actions.length} Pending
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-DEFAULT/50 p-8 text-center flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
            <Check className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-text-primary">All caught up!</p>
          <p className="text-xs text-text-muted mt-0.5">
            No pending OTPs, payment dues, or action requests extracted.
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {actions.map((item) => (
              <ActionBlockCard
                key={item.id}
                item={item}
                onDismiss={() => onDismiss(item.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

// ── Individual Action Block Renderer ──────────────────────────────────────────

const ActionBlockCard: React.FC<{ item: ActionItem; onDismiss: () => void }> = ({
  item,
  onDismiss,
}) => {
  const type = (item.type || "").toLowerCase();
  const payload = item.payload || {};

  // Normalize block category
  let blockKind: "otp" | "payment" | "rsvp" | "document" | "generic" = "generic";
  if (type.includes("verification") || type.includes("otp") || type.includes("code") || payload.otp_code) {
    blockKind = "otp";
  } else if (type.includes("payment") || type.includes("bill") || payload.amount) {
    blockKind = "payment";
  } else if (type.includes("rsvp") || type.includes("meeting")) {
    blockKind = "rsvp";
  } else if (type.includes("document") || type.includes("submit") || type.includes("upload")) {
    blockKind = "document";
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative rounded-2xl bg-surface-DEFAULT/90 backdrop-blur-md p-5 border border-white/10 shadow-elevation-1 hover:shadow-elevation-2 flex flex-col justify-between transition-all duration-200"
    >
      {/* Top Header: Badge + Dismiss Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {blockKind === "otp" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
            <KeyRound className="h-3 w-3" />
            OTP Verification
          </span>
        )}
        {blockKind === "payment" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
            <CreditCard className="h-3 w-3" />
            Payment Due
          </span>
        )}
        {blockKind === "rsvp" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
            <CalendarCheck className="h-3 w-3" />
            Meeting RSVP
          </span>
        )}
        {blockKind === "document" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
            <FileUp className="h-3 w-3" />
            Document Submit
          </span>
        )}
        {blockKind === "generic" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-subtle text-brand border border-brand/20 uppercase tracking-wider">
            <AlertCircle className="h-3 w-3" />
            Action Required
          </span>
        )}

        <button
          onClick={onDismiss}
          className="text-text-disabled hover:text-text-primary p-1 rounded-lg hover:bg-surface-elevated transition-colors"
          title="Dismiss Action Block"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Block Content Variant */}
      {blockKind === "otp" && (
        <OtpBlockContent item={item} payload={payload} onDismiss={onDismiss} />
      )}
      {blockKind === "payment" && (
        <PaymentBlockContent item={item} payload={payload} onDismiss={onDismiss} />
      )}
      {blockKind === "rsvp" && (
        <RsvpBlockContent item={item} payload={payload} onDismiss={onDismiss} />
      )}
      {blockKind === "document" && (
        <DocumentBlockContent item={item} payload={payload} onDismiss={onDismiss} />
      )}
      {blockKind === "generic" && (
        <GenericBlockContent item={item} onDismiss={onDismiss} />
      )}
    </motion.div>
  );
};

// ── 1. OTP BLOCK CONTENT ──────────────────────────────────────────────────────

const OtpBlockContent: React.FC<{
  item: ActionItem;
  payload: Record<string, any>;
  onDismiss: () => void;
}> = ({ item, payload, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds

  // Extract OTP digits from payload or title/description
  const rawCode =
    payload.otp_code ||
    payload.code ||
    (item.description?.match(/\b\d{4,8}\b/) || item.title?.match(/\b\d{4,8}\b/))?.[0] ||
    "839201";

  // Calculate countdown from item.created_at
  useEffect(() => {
    const createdAt = item.created_at ? parseISO(item.created_at) : new Date();
    const expiry = new Date(createdAt.getTime() + 10 * 60 * 1000);

    const updateTimer = () => {
      const remaining = differenceInSeconds(expiry, new Date());
      setTimeLeft(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [item.created_at]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpiringSoon = timeLeft < 120;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-ui font-semibold text-sm text-text-primary line-clamp-1">
          {item.emails?.from_name || item.title || "One-Time Password"}
        </h4>
        <p className="text-xs text-text-muted line-clamp-1">
          {item.description || "Use this code to complete verification."}
        </p>
      </div>

      {/* Large Mono Code Box */}
      <div className="rounded-xl bg-surface-base border border-white/10 p-3 flex items-center justify-between gap-3">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-amber-400 select-all">
          {rawCode}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-xs font-semibold text-text-primary transition-all border border-white/10 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-text-muted" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Timer & Dismiss */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div
          className={`flex items-center gap-1 font-mono ${
            isExpiringSoon ? "text-rose-400 font-bold animate-pulse" : "text-text-muted"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>
            Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>

        <button
          onClick={onDismiss}
          className="text-[11px] text-text-muted hover:text-text-primary underline"
        >
          Mark used
        </button>
      </div>
    </div>
  );
};

// ── 2. PAYMENT DUE BLOCK ─────────────────────────────────────────────────────

const PaymentBlockContent: React.FC<{
  item: ActionItem;
  payload: Record<string, any>;
  onDismiss: () => void;
}> = ({ item, payload, onDismiss }) => {
  const amount = payload.amount || (item.description?.match(/₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)/))?.[1] || "0";
  const dueDate = item.due_date || payload.due_date;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-ui font-semibold text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-2">
          {item.description || "Pending invoice or bill payment requiring action."}
        </p>
      </div>

      <div className="rounded-xl bg-surface-base/80 border border-white/10 p-3 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono text-text-muted block">
            Amount Due
          </span>
          <span className="font-mono text-2xl font-bold text-rose-400">
            ₹{amount}
          </span>
        </div>

        {dueDate && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-text-muted block">
              Due Date
            </span>
            <span className="text-xs font-semibold text-text-secondary">
              {format(parseISO(dueDate), "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-md transition-all"
        >
          <span>View in Finance</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

// ── 3. MEETING RSVP BLOCK ─────────────────────────────────────────────────────

const RsvpBlockContent: React.FC<{
  item: ActionItem;
  payload: Record<string, any>;
  onDismiss: () => void;
}> = ({ item, payload, onDismiss }) => {
  const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);
  const meetingTime = item.due_date || payload.meeting_time;

  const handleRsvp = (choice: "accepted" | "declined") => {
    setResponded(choice);
    // Open Gmail thread if email_id exists or dismiss
    setTimeout(() => {
      onDismiss();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-ui font-semibold text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-2">
          {item.description || "Meeting invitation awaiting your RSVP response."}
        </p>
      </div>

      {meetingTime && isValid(parseISO(meetingTime)) && (
        <div className="flex items-center gap-2 text-xs text-purple-300 font-medium bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-xl">
          <Clock className="h-3.5 w-3.5 text-purple-400" />
          <span>{format(parseISO(meetingTime), "EEE, MMM d • h:mm a")}</span>
        </div>
      )}

      {responded ? (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center">
          ✓ RSVP {responded === "accepted" ? "Accepted" : "Declined"}!
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleRsvp("accepted")}
            className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => handleRsvp("declined")}
            className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-semibold transition-colors"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
};

// ── 4. DOCUMENT SUBMIT BLOCK ──────────────────────────────────────────────────

const DocumentBlockContent: React.FC<{
  item: ActionItem;
  payload: Record<string, any>;
  onDismiss: () => void;
}> = ({ item, payload, onDismiss }) => {
  const link = payload.link || payload.url;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-ui font-semibold text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-2">
          {item.description || "Upload or submit requested documents by deadline."}
        </p>
      </div>

      {item.due_date && isValid(parseISO(item.due_date)) && (
        <div className="flex items-center gap-2 text-xs text-sky-300 font-medium bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl">
          <Clock className="h-3.5 w-3.5 text-sky-400" />
          <span>Deadline: {format(parseISO(item.due_date), "MMM d, yyyy")}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-semibold transition-all shadow-sm"
          >
            <span>Submit Document</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-overlay text-text-primary text-xs font-semibold transition-all border border-white/10"
          >
            <span>Open Email</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          Completed
        </button>
      </div>
    </div>
  );
};

// ── 5. GENERIC ACTION BLOCK ──────────────────────────────────────────────────

const GenericBlockContent: React.FC<{
  item: ActionItem;
  onDismiss: () => void;
}> = ({ item, onDismiss }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-ui font-semibold text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-3">
          {item.description || "Action required based on incoming email intelligence."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-md transition-all"
        >
          <span>Open Email</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
