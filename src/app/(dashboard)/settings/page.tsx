"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@/hooks/useGSAP";
import {
  Mail,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Server,
  Calendar,
  History,
  Play,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface GmailAccount {
  id: string;
  email: string;
  display_name?: string | null;
  last_synced_at?: string | null;
  sync_enabled: boolean;
  watch_expiry?: string | null;
}

export interface N8nStatus {
  online: boolean;
  version?: string;
}

export interface BatchJobInfo {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_emails: number;
  processed_count: number;
  percent: number;
  eta_minutes?: number;
  date_from?: string;
  date_to?: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Data States
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null);
  const [isN8nLoading, setIsN8nLoading] = useState(true);

  // Historical Batch States
  const defaultFromDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const defaultToDate = new Date().toISOString().split("T")[0];

  const [dateRanges, setDateRanges] = useState<
    Record<string, { from: string; to: string }>
  >({});
  const [accountJobs, setAccountJobs] = useState<Record<string, BatchJobInfo>>({});
  const [startingJobAccountId, setStartingJobAccountId] = useState<string | null>(null);

  // Interaction States
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<GmailAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);

  // Check URL params on mount for OAuth redirect feedback
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setToastMessage({
        type: "success",
        text: "Gmail account successfully connected! Sync has been initialized.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (searchParams.get("error")) {
      const err = searchParams.get("error");
      setToastMessage({
        type: "error",
        text: `Authentication failed (${err}). Please try connecting again.`,
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Fetch Accounts
  const fetchAccounts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings/gmail-accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch connected accounts");
      }
      const data = await res.json();
      const accountsList: GmailAccount[] = Array.isArray(data) ? data : data.accounts || [];
      setAccounts(accountsList);

      // Initialize date ranges for each account
      const initialRanges: Record<string, { from: string; to: string }> = {};
      accountsList.forEach((acc) => {
        initialRanges[acc.id] = { from: defaultFromDate, to: defaultToDate };
      });
      setDateRanges((prev) => ({ ...initialRanges, ...prev }));
    } catch (err) {
      console.error(err);
      setToastMessage({
        type: "error",
        text: "Unable to load Gmail accounts. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [defaultFromDate, defaultToDate]);

  // Fetch User's existing Batch Jobs on mount
  const fetchUserJobs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/batch/user-jobs");
      if (res.ok) {
        const jobs = await res.json();
        if (Array.isArray(jobs)) {
          const map: Record<string, BatchJobInfo> = {};
          jobs.forEach((j) => {
            if (j.gmail_account_id && !map[j.gmail_account_id]) {
              map[j.gmail_account_id] = {
                job_id: j.id,
                status: j.status,
                total_emails: j.total_emails || 0,
                processed_count: j.processed_count || 0,
                percent: j.percent || 0,
                eta_minutes: j.eta_minutes,
                date_from: j.date_from,
                date_to: j.date_to,
              };
            }
          });
          setAccountJobs((prev) => ({ ...map, ...prev }));
        }
      }
    } catch (err) {
      console.warn("Could not fetch user batch jobs:", err);
    }
  }, []);

  // Fetch n8n Status
  const fetchN8nStatus = React.useCallback(async () => {
    try {
      setIsN8nLoading(true);
      const res = await fetch("/api/settings/n8n-status");
      if (res.ok) {
        const data = await res.json();
        setN8nStatus(data);
      } else {
        setN8nStatus({ online: false });
      }
    } catch {
      setN8nStatus({ online: false });
    } finally {
      setIsN8nLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchN8nStatus();
    fetchUserJobs();
  }, [fetchAccounts, fetchN8nStatus, fetchUserJobs]);

  // Polling active batch jobs every 10 seconds
  useEffect(() => {
    const activeAccountEntries = Object.entries(accountJobs).filter(
      ([_, job]) => job.status === "pending" || job.status === "processing"
    );

    if (activeAccountEntries.length === 0) return;

    const interval = setInterval(async () => {
      for (const [accId, job] of activeAccountEntries) {
        try {
          const res = await fetch(`/api/batch/status/${job.job_id}`);
          if (res.ok) {
            const data = await res.json();
            setAccountJobs((prev) => ({
              ...prev,
              [accId]: {
                job_id: data.job_id || job.job_id,
                status: data.status,
                total_emails: data.total_emails || 0,
                processed_count: data.processed_count || 0,
                percent: data.percent ?? data.progress_pct ?? 0,
                eta_minutes: data.eta_minutes,
                date_from: data.date_from,
                date_to: data.date_to,
              },
            }));
          }
        } catch (err) {
          console.error("Batch polling error:", err);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [accountJobs]);

  // GSAP Entrance animation
  useGSAP(
    () => {
      if (pageContainerRef.current) {
        gsap.from(".gsap-header", {
          opacity: 0,
          y: -16,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    },
    { scope: pageContainerRef }
  );

  // Toggle Account Sync
  const handleToggleSync = async (account: GmailAccount) => {
    if (togglingId) return;
    const targetState = !account.sync_enabled;

    // Optimistic UI update
    setTogglingId(account.id);
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === account.id ? { ...acc, sync_enabled: targetState } : acc
      )
    );

    try {
      const res = await fetch(`/api/settings/gmail-accounts/${account.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_enabled: targetState }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle sync");
      }

      const updatedData = await res.json();
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id
            ? { ...acc, sync_enabled: updatedData.sync_enabled }
            : acc
        )
      );
      setToastMessage({
        type: "success",
        text: `Sync ${targetState ? "resumed" : "paused"} for ${account.email}`,
      });
    } catch {
      // Rollback on failure
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === account.id ? { ...acc, sync_enabled: account.sync_enabled } : acc
        )
      );
      setToastMessage({
        type: "error",
        text: `Failed to update sync status for ${account.email}`,
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Account
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/settings/gmail-accounts/${accountToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete account");
      }

      setAccounts((prev) => prev.filter((acc) => acc.id !== accountToDelete.id));
      setToastMessage({
        type: "success",
        text: `Disconnected ${accountToDelete.email}`,
      });
      setAccountToDelete(null);
    } catch {
      setToastMessage({
        type: "error",
        text: `Failed to disconnect ${accountToDelete.email}. Please try again.`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Start Historical Batch Import
  const handleStartImport = async (account: GmailAccount) => {
    if (startingJobAccountId) return;
    const range = dateRanges[account.id] || { from: defaultFromDate, to: defaultToDate };

    setStartingJobAccountId(account.id);
    try {
      const res = await fetch("/api/batch/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmail_account_id: account.id,
          date_from: range.from,
          date_to: range.to,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.job_id) {
          // Active job already exists - link to it
          setAccountJobs((prev) => ({
            ...prev,
            [account.id]: {
              job_id: data.job_id,
              status: "processing",
              total_emails: 0,
              processed_count: 0,
              percent: 0,
            },
          }));
          setToastMessage({
            type: "info",
            text: `An active import is already in progress for ${account.email}`,
          });
          return;
        }
        throw new Error(data.error || "Failed to start batch import");
      }

      setAccountJobs((prev) => ({
        ...prev,
        [account.id]: {
          job_id: data.job_id,
          status: "pending",
          total_emails: data.estimated_total || 0,
          processed_count: 0,
          percent: 0,
          date_from: range.from,
          date_to: range.to,
        },
      }));

      setToastMessage({
        type: "success",
        text: `Historical import queued for ${account.email}! n8n will process chunks in the background.`,
      });
    } catch (err) {
      console.error("Failed to start historical import:", err);
      setToastMessage({
        type: "error",
        text: `Unable to start import for ${account.email}. Please try again.`,
      });
    } finally {
      setStartingJobAccountId(null);
    }
  };

  const handleCopyDockerCmd = () => {
    navigator.clipboard.writeText("docker compose up -d");
    setCopiedDockerCmd(true);
    setTimeout(() => setCopiedDockerCmd(false), 2000);
  };

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Never";
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return "Never";
    }
  };

  // Expiry check: watch_expiry < now + 24 hours
  const isExpiringSoon = (expiryStr?: string | null) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr).getTime();
    if (isNaN(expiry)) return false;
    const within24h = Date.now() + 24 * 60 * 60 * 1000;
    return expiry < within24h;
  };

  const maxAccountsReached = accounts.length >= 4;

  return (
    <div ref={pageContainerRef} className="max-w-4xl mx-auto flex flex-col gap-6 font-sans pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm shadow-xs ${toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : toastMessage.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-surface-elevated border-border-default text-text-primary"
              }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : toastMessage.type === "error" ? (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 px-1 py-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header & n8n Status Ribbon */}
      <div className="gsap-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage your connected Gmail inboxes, sync pipelines, and background automation.
          </p>
        </div>

        {/* SECTION 3: n8n Status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${isN8nLoading
                ? "bg-surface-subtle border-border-default text-text-muted"
                : n8nStatus?.online
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isN8nLoading
                  ? "bg-text-muted animate-pulse"
                  : n8nStatus?.online
                    ? "bg-emerald-600 animate-pulse"
                    : "bg-rose-600"
                }`}
            />
            <span>
              {isN8nLoading
                ? "Checking n8n..."
                : n8nStatus?.online
                  ? `n8n Online ${n8nStatus.version ? `(v${n8nStatus.version})` : ""}`
                  : "n8n Offline"}
            </span>
          </div>

          <button
            onClick={fetchN8nStatus}
            title="Refresh n8n status"
            disabled={isN8nLoading}
            className="p-1.5 rounded-lg border border-border-default text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isN8nLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Offline Alert Box if n8n is unreachable */}
      <AnimatePresence>
        {!isN8nLoading && n8nStatus && !n8nStatus.online && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-semibold text-amber-900">Email sync paused</span>
                  <span className="text-amber-800 ml-1.5">
                    Start Docker to resume real-time webhook processing
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyDockerCmd}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-border-default text-text-primary text-xs font-mono hover:bg-surface-hover transition-colors shrink-0 shadow-xs"
              >
                {copiedDockerCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-800">Copied!</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5 text-text-muted" />
                    <span>docker compose up -d</span>
                    <Copy className="w-3 h-3 text-text-muted ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 4: AI Classification One-Liner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-surface-elevated border border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-border-default flex items-center justify-center text-text-primary shrink-0">
            <Cpu className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
              Pipeline Architecture
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-text-secondary mt-0.5 font-medium">
              <span className="text-text-primary font-semibold">Classification:</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border-default text-text-primary text-xs font-mono">
                Tier 1 (rules)
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
              <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border-default text-text-primary text-xs font-mono">
                Tier 2 (HuggingFace)
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
              <span className="px-2 py-0.5 rounded-md bg-brand/10 border border-brand/30 text-brand text-xs font-mono font-bold">
                Tier 3 (Gemini 2.5 Flash Lite)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 & 2: Connected Gmail Accounts Card */}
      <div className="bg-surface-elevated rounded-2xl border border-border-default p-4 sm:p-6 flex flex-col gap-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
                Connected Gmail Accounts
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-border-default text-text-secondary">
                {accounts.length}/4
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Connect inboxes to allow BriefMail to read, categorize, and prioritize your emails.
            </p>
          </div>

          {/* SECTION 2: Add Gmail Account Button */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <motion.button
              whileTap={maxAccountsReached ? undefined : { scale: 0.98 }}
              disabled={maxAccountsReached}
              onClick={() => {
                window.location.href = "/api/gmail/auth";
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans font-medium text-sm transition-all shadow-xs ${maxAccountsReached
                  ? "bg-surface-subtle border border-border-default text-text-muted cursor-not-allowed"
                  : "bg-text-primary text-white hover:bg-text-primary/90"
                }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {maxAccountsReached ? "Maximum accounts connected" : "Connect Gmail Account"}
              </span>
            </motion.button>
            <span className="text-[11px] text-text-muted">
              {maxAccountsReached
                ? "Account limit reached (4 of 4)"
                : "Connect up to 4 accounts"}
            </span>
          </div>
        </div>

        {/* Accounts List / Skeleton / Empty State */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-surface-subtle/50 border border-border-default animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-surface-elevated shrink-0 border border-border-default" />
                    <div className="flex flex-col gap-2">
                      <div className="w-40 sm:w-56 h-4 rounded bg-surface-elevated" />
                      <div className="w-24 h-3 rounded bg-surface-elevated" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                    <div className="w-16 h-6 rounded-full bg-surface-elevated" />
                    <div className="w-12 h-6 rounded-full bg-surface-elevated" />
                    <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
                  </div>
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 px-4 flex flex-col items-center justify-center text-center rounded-xl bg-surface-subtle/30 border border-dashed border-border-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border-default flex items-center justify-center text-text-primary mb-3 shadow-xs">
                <Mail className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-base font-serif font-bold text-text-primary">
                No Gmail accounts connected yet
              </h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mt-1 mb-5 leading-relaxed">
                Connect your first Gmail inbox to start automated triage, instant categorization,
                and background action extraction.
              </p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  window.location.href = "/api/gmail/auth";
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans font-medium text-sm bg-text-primary text-white hover:bg-text-primary/90 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Gmail Account</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 },
                },
              }}
              className="flex flex-col gap-3"
            >
              {accounts.map((account) => {
                const initialLetter = (account.display_name || account.email)
                  .charAt(0)
                  .toUpperCase();
                const expiring = isExpiringSoon(account.watch_expiry);
                const isToggling = togglingId === account.id;

                return (
                  <motion.div
                    key={account.id}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.35, ease: "easeOut" },
                      },
                    }}
                    layout
                    className="group relative p-4 rounded-xl bg-surface-subtle/40 border border-border-default hover:border-border-hover transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Avatar & Account Meta */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-text-primary font-mono font-bold text-xs shadow-xs shrink-0 border border-border-default">
                          {initialLetter}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-medium text-sm sm:text-base text-text-primary truncate">
                              {account.email}
                            </span>
                            {account.display_name && (
                              <span className="text-xs text-text-muted hidden md:inline">
                                ({account.display_name})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-text-muted">
                            <span>
                              Last synced:{" "}
                              <span className="text-text-secondary font-mono font-medium">
                                {formatRelativeTime(account.last_synced_at)}
                              </span>
                            </span>

                            {/* Watch Expiry Warning */}
                            {expiring && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Sync expiring soon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge, Toggle Switch, Remove Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                        {/* Status Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${account.sync_enabled
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-surface-subtle text-text-muted border border-border-default"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${account.sync_enabled ? "bg-emerald-600" : "bg-text-muted"
                              }`}
                          />
                          <span>{account.sync_enabled ? "Active" : "Paused"}</span>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted hidden lg:inline">
                            {account.sync_enabled ? "Syncing" : "Paused"}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={account.sync_enabled}
                            disabled={isToggling}
                            onClick={() => handleToggleSync(account)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${account.sync_enabled ? "bg-text-primary" : "bg-border-strong"
                              }`}
                          >
                            <span className="sr-only">Toggle Sync</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${account.sync_enabled ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => setAccountToDelete(account)}
                          title="Disconnect account"
                          className="p-2 rounded-lg text-text-muted hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Remove Account</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* SECTION: Historical Email Sync */}
      <div className="bg-surface-elevated rounded-2xl border border-border-default p-4 sm:p-6 flex flex-col gap-5 shadow-xs">
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand" />
            <h2 className="font-serif text-base sm:text-lg font-bold text-text-primary">
              Historical Email Sync
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Import your past emails for finance tracking, job history, and meeting summaries.
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            Connect a Gmail account above to start historical imports.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {accounts.map((account) => {
              const currentRange = dateRanges[account.id] || {
                from: defaultFromDate,
                to: defaultToDate,
              };
              const activeJob = accountJobs[account.id];
              const isStarting = startingJobAccountId === account.id;
              const isProcessing =
                activeJob?.status === "pending" || activeJob?.status === "processing";
              const isCompleted = activeJob?.status === "completed";

              return (
                <div
                  key={account.id}
                  className="p-4 rounded-xl bg-surface-subtle/40 border border-border-default flex flex-col gap-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="font-sans font-medium text-sm text-text-primary">
                        {account.email}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 self-start sm:self-auto">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Import complete
                      </span>
                    ) : isProcessing ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-50 border border-amber-200 text-amber-800 self-start sm:self-auto">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        {activeJob.status === "pending" ? "In Queue..." : "Syncing..."}
                      </span>
                    ) : null}
                  </div>

                  {/* Date Pickers & Import Action */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 border-t border-border-subtle">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          From
                        </label>
                        <input
                          type="date"
                          disabled={isProcessing}
                          value={currentRange.from}
                          onChange={(e) =>
                            setDateRanges((prev) => ({
                              ...prev,
                              [account.id]: {
                                ...currentRange,
                                from: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-default text-xs text-text-primary focus:outline-none focus:border-border-hover font-mono disabled:opacity-50 transition-colors shadow-xs"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          To
                        </label>
                        <input
                          type="date"
                          disabled={isProcessing}
                          value={currentRange.to}
                          onChange={(e) =>
                            setDateRanges((prev) => ({
                              ...prev,
                              [account.id]: {
                                ...currentRange,
                                to: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-default text-xs text-text-primary focus:outline-none focus:border-border-hover font-mono disabled:opacity-50 transition-colors shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0 w-full sm:w-auto">
                      <motion.button
                        whileTap={isProcessing || isStarting ? undefined : { scale: 0.98 }}
                        disabled={isProcessing || isStarting}
                        onClick={() => handleStartImport(account)}
                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-sans font-medium text-xs transition-all shadow-xs ${isProcessing
                            ? "bg-surface-subtle border border-border-default text-text-muted cursor-not-allowed"
                            : "bg-text-primary text-white hover:bg-text-primary/90"
                          }`}
                      >
                        {isStarting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Queueing...</span>
                          </>
                        ) : isProcessing ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-brand" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isCompleted ? "Re-import" : "Start Import"}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Progress Bar Display */}
                  {activeJob && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>
                          {isCompleted
                            ? `Completed import of ${activeJob.processed_count} emails`
                            : activeJob.total_emails > 0
                              ? `Processing ${activeJob.processed_count} of ${activeJob.total_emails} emails...`
                              : `Processing ${activeJob.processed_count} emails...`}
                        </span>
                        <span className="font-mono font-medium text-text-primary">
                          {activeJob.percent}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden border border-border-default">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, activeJob.percent))}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${isCompleted
                              ? "bg-emerald-600"
                              : "bg-text-primary"
                            }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Delete */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-surface-elevated rounded-2xl border border-border-default p-6 shadow-lg flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-text-primary">
                    Disconnect Gmail Account
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    This will stop synchronization for this inbox.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle border border-border-default text-xs text-text-secondary leading-relaxed">
                Are you sure you want to disconnect{" "}
                <span className="font-semibold text-text-primary">
                  {accountToDelete.email}
                </span>
                ? Real-time webhooks, email classifications, and scheduled syncs for this account
                will be permanently revoked.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setAccountToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border-default transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isDeleting ? "Disconnecting..." : "Yes, Disconnect"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto flex flex-col gap-6 font-sans animate-pulse">
          <div className="h-10 w-48 rounded-lg bg-surface-elevated border border-border-default" />
          <div className="h-64 rounded-2xl bg-surface-elevated border border-border-default" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
