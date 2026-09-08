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
import { format, parseISO, isValid, differenceInSeconds, formatDistanceToNow } from "date-fns";

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

export interface OtpEmailItem {
  id: string;
  subject: string;
  from_name?: string | null;
  from_email?: string | null;
  snippet?: string | null;
  received_at?: string;
  category?: string;
  subcategory?: string;
}

/**
 * Parses OTP code from subject using regex: /\b(\d{4,8})\b/ or /code[:\s]+(\w+)/i
 * with fallback to snippet extraction.
 */
export function parseOtpCode(subject: string, snippet?: string | null): string {
  if (!subject) return "••••••";

  // 1. Primary check on subject: /\b(\d{4,8})\b/ or /code[:\s]+(\w+)/i
  const subDigits = subject.match(/\b(\d{4,8})\b/);
  if (subDigits) return subDigits[1];

  const subCode = subject.match(/code[:\s]+([A-Za-z0-9]{4,8})/i) || subject.match(/code[:\s]+(\w+)/i);
  if (subCode && !["with", "from", "your", "this", "that", "is", "for"].includes(subCode[1].toLowerCase())) {
    return subCode[1];
  }

  // 2. Fallback to snippet digits or code
  const snipDigits = (snippet || "").match(/\b(\d{4,8})\b/);
  if (snipDigits) return snipDigits[1];

  const snipCode = (snippet || "").match(/code[:\s]+(?:is[:\s]*)?([A-Za-z0-9]{4,8})/i);
  if (snipCode) return snipCode[1];

  return "••••••";
}

// ── OtpEmailBlockCard Component ───────────────────────────────────────────────

export const OtpEmailBlockCard: React.FC<{
  email: OtpEmailItem;
  onDismiss: () => void;
}> = ({ email, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const otpCode = parseOtpCode(email.subject, email.snippet);

  // Auto-expire visual: if received > 10 min ago show "Expired"
  const receivedDate = email.received_at ? parseISO(email.received_at) : new Date();
  const isExpired = Date.now() - receivedDate.getTime() > 10 * 60 * 1000;

  const relativeTime = email.received_at
    ? formatDistanceToNow(receivedDate, { addSuffix: true })
    : "";

  const handleCopy = () => {
    if (!otpCode || otpCode === "••••••") return;
    navigator.clipboard.writeText(otpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fromLabel = email.from_name || email.from_email || "Unknown Sender";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`group relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 ${
        isExpired
          ? "bg-surface-subtle/60 border-border-default opacity-75"
          : "bg-surface-elevated border-amber-300/70 shadow-xs hover:shadow-sm hover:border-amber-400"
      }`}
    >
      {/* Top Header: Badge + Dismiss Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
              isExpired
                ? "bg-surface-subtle text-text-muted border border-border-default"
                : "bg-amber-50 text-amber-800 border border-amber-200/80"
            }`}
          >
            <KeyRound className="h-3 w-3" />
            OTP Verification
          </span>

          {/* Auto-expire visual */}
          {isExpired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/70">
              Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Active
            </span>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-subtle transition-colors"
          title="Dismiss OTP Block"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* From label and subject */}
      <div className="space-y-1 mb-3">
        <div className="text-xs text-text-muted">
          From: <span className="text-text-primary font-medium">{fromLabel}</span>
        </div>
        <p className="text-xs text-text-secondary line-clamp-1" title={email.subject}>
          {email.subject}
        </p>
      </div>

      {/* Large Monospace OTP Display */}
      <div
        className={`rounded-xl border p-3 flex items-center justify-between gap-3 mb-3 ${
          isExpired
            ? "bg-surface-subtle/50 border-border-default"
            : "bg-surface-subtle border-border-default"
        }`}
      >
        <span
          className={`font-mono text-2xl sm:text-3xl font-bold tracking-widest select-all ${
            isExpired
              ? "text-text-muted line-through"
              : "text-text-primary"
          }`}
        >
          {otpCode}
        </span>

        <button
          onClick={handleCopy}
          disabled={isExpired && otpCode === "••••••"}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-xs ${
            copied
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : isExpired
              ? "bg-surface-elevated border-border-default text-text-muted cursor-not-allowed"
              : "bg-surface-elevated hover:bg-surface-hover text-text-primary border-border-default hover:border-border-hover"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-text-muted" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Footer: Received Time */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border-subtle">
        <span className="flex items-center gap-1 font-mono text-[11px]">
          <Clock className="h-3 w-3" />
          {relativeTime || "Just now"}
        </span>

        {isExpired ? (
          <span className="text-[11px] text-rose-700 font-medium">Window expired</span>
        ) : (
          <span className="text-[11px] text-amber-800 font-medium">Valid &bull; 10m window</span>
        )}
      </div>
    </motion.div>
  );
};

// ── Main ActionBlockGrid ──────────────────────────────────────────────────────

interface ActionBlockGridProps {
  actions?: ActionItem[];
  onDismiss?: (id: string) => void;
}

export const ActionBlockGrid: React.FC<ActionBlockGridProps> = ({
  actions = [],
  onDismiss,
}) => {
  const [otpEmails, setOtpEmails] = useState<OtpEmailItem[]>([]);
  const [loadingOtp, setLoadingOtp] = useState<boolean>(true);
  const [dismissedOtpIds, setDismissedOtpIds] = useState<Set<string>>(new Set());

  // Query /api/emails?category=otp&limit=20 on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchOtps() {
      try {
        setLoadingOtp(true);
        const res = await fetch("/api/emails?category=otp&limit=20");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOtpEmails(data.emails || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch OTP emails:", err);
      } finally {
        if (isMounted) setLoadingOtp(false);
      }
    }
    fetchOtps();
    return () => {
      isMounted = false;
    };
  }, []);

  const visibleOtps = otpEmails.filter((e) => !dismissedOtpIds.has(e.id));
  const totalItems = visibleOtps.length + actions.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            Extracted Action Blocks
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            High-intent OTPs and time-sensitive requests isolated directly from incoming messages.
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-subtle text-text-secondary border border-border-default">
          {totalItems} Available
        </span>
      </div>

      {loadingOtp && totalItems === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-surface-elevated border border-border-default animate-pulse p-5"
            />
          ))}
        </div>
      ) : totalItems === 0 ? (
        <div className="rounded-2xl border border-border-default bg-surface-elevated p-8 text-center flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 border border-emerald-200">
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
            {/* Render OTP Email Blocks */}
            {visibleOtps.map((email) => (
              <OtpEmailBlockCard
                key={email.id}
                email={email}
                onDismiss={() =>
                  setDismissedOtpIds((prev) => new Set([...prev, email.id]))
                }
              />
            ))}

            {/* Render Standard Action Blocks */}
            {actions.map((item) => (
              <ActionBlockCard
                key={item.id}
                item={item}
                onDismiss={() => onDismiss?.(item.id)}
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
      className="group relative rounded-2xl bg-surface-elevated p-5 border border-border-default shadow-xs hover:border-border-hover flex flex-col justify-between transition-all duration-200"
    >
      {/* Top Header: Badge + Dismiss Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {blockKind === "otp" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide">
            <KeyRound className="h-3 w-3" />
            OTP Verification
          </span>
        )}
        {blockKind === "payment" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200/80 tracking-wide">
            <CreditCard className="h-3 w-3" />
            Payment Due
          </span>
        )}
        {blockKind === "rsvp" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200/80 tracking-wide">
            <CalendarCheck className="h-3 w-3" />
            Meeting RSVP
          </span>
        )}
        {blockKind === "document" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200/80 tracking-wide">
            <FileUp className="h-3 w-3" />
            Document Submit
          </span>
        )}
        {blockKind === "generic" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-subtle text-text-secondary border border-border-default tracking-wide">
            <AlertCircle className="h-3 w-3" />
            Action Required
          </span>
        )}

        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-surface-subtle transition-colors"
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
        <h4 className="font-sans font-medium text-sm text-text-primary line-clamp-1">
          {item.emails?.from_name || item.title || "One-Time Password"}
        </h4>
        <p className="text-xs text-text-muted line-clamp-1">
          {item.description || "Use this code to complete verification."}
        </p>
      </div>

      {/* Large Mono Code Box */}
      <div className="rounded-xl bg-surface-subtle border border-border-default p-3 flex items-center justify-between gap-3">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-text-primary select-all">
          {rawCode}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-xs font-medium text-text-primary transition-all border border-border-default shadow-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
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
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border-subtle">
        <div
          className={`flex items-center gap-1 font-mono ${
            isExpiringSoon ? "text-rose-700 font-medium animate-pulse" : "text-text-muted"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>
            Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>

        <button
          onClick={onDismiss}
          className="text-[11px] text-text-muted hover:text-text-primary underline underline-offset-2"
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
        <h4 className="font-sans font-medium text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-2">
          {item.description || "Pending invoice or bill payment requiring action."}
        </p>
      </div>

      <div className="rounded-xl bg-surface-subtle border border-border-default p-3 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono text-text-muted block">
            Amount Due
          </span>
          <span className="font-mono text-2xl font-bold text-text-primary">
            ₹{amount}
          </span>
        </div>

        {dueDate && (
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-text-muted block">
              Due Date
            </span>
            <span className="text-xs font-mono font-medium text-text-secondary">
              {format(parseISO(dueDate), "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-text-primary hover:bg-text-primary/90 text-white text-xs font-medium transition-all shadow-xs"
        >
          <span>View in Finance</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary underline underline-offset-2"
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
    setTimeout(() => {
      onDismiss();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-sans font-medium text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-2">
          {item.description || "Meeting invitation awaiting your RSVP response."}
        </p>
      </div>

      {meetingTime && isValid(parseISO(meetingTime)) && (
        <div className="flex items-center gap-2 text-xs text-purple-800 font-medium bg-purple-50 border border-purple-200/80 px-3 py-2 rounded-xl">
          <Clock className="h-3.5 w-3.5 text-purple-600" />
          <span>{format(parseISO(meetingTime), "EEE, MMM d • h:mm a")}</span>
        </div>
      )}

      {responded ? (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
          ✓ RSVP {responded === "accepted" ? "Accepted" : "Declined"}!
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleRsvp("accepted")}
            className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors"
          >
            Accept
          </button>
          <button
            onClick={() => handleRsvp("declined")}
            className="flex-1 py-2 rounded-xl bg-surface-subtle hover:bg-rose-50 text-rose-800 border border-border-default text-xs font-medium transition-colors"
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
        <h4 className="font-sans font-medium text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-2">
          {item.description || "Upload or submit requested documents by deadline."}
        </p>
      </div>

      {item.due_date && isValid(parseISO(item.due_date)) && (
        <div className="flex items-center gap-2 text-xs text-sky-800 font-medium bg-sky-50 border border-sky-200/80 px-3 py-1.5 rounded-xl">
          <Clock className="h-3.5 w-3.5 text-sky-600" />
          <span>Deadline: {format(parseISO(item.due_date), "MMM d, yyyy")}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-text-primary hover:bg-text-primary/90 text-white text-xs font-medium transition-all shadow-xs"
          >
            <span>Submit Document</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover text-text-primary text-xs font-medium transition-all border border-border-default"
          >
            <span>Open Email</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary underline underline-offset-2"
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
        <h4 className="font-sans font-medium text-sm text-text-primary line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-text-muted line-clamp-3">
          {item.description || "Action required based on incoming email intelligence."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link
          href="/inbox"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-text-primary hover:bg-text-primary/90 text-white text-xs font-medium transition-all shadow-xs"
        >
          <span>Open Email</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary underline underline-offset-2"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
