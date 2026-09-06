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

function SettingsContent() {
  const searchParams = useSearchParams();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Data States
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null);
  const [isN8nLoading, setIsN8nLoading] = useState(true);

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
      // Clean query string from URL without full reload
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
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings/gmail-accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch connected accounts");
      }
      const data = await res.json();
      const accountsList = Array.isArray(data) ? data : data.accounts || [];
      setAccounts(accountsList);
    } catch (err) {
      console.error(err);
      setToastMessage({
        type: "error",
        text: "Unable to load Gmail accounts. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch n8n Status
  const fetchN8nStatus = async () => {
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
  };

  useEffect(() => {
    fetchAccounts();
    fetchN8nStatus();
  }, []);

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
    <div ref={pageContainerRef} className="max-w-4xl mx-auto flex flex-col gap-6 font-ui">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm shadow-elevation-2 ${
              toastMessage.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : toastMessage.type === "error"
                ? "bg-rose-950/40 border-rose-500/30 text-rose-300"
                : "bg-surface-elevated border-border-strong text-text-primary"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toastMessage.type === "error" ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Manage your connected Gmail inboxes, sync pipelines, and background automation.
          </p>
        </div>

        {/* SECTION 3: n8n Status indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border backdrop-blur-md transition-colors ${
              isN8nLoading
                ? "bg-surface border-border-subtle text-text-muted"
                : n8nStatus?.online
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/25 text-rose-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isN8nLoading
                  ? "bg-text-muted animate-pulse"
                  : n8nStatus?.online
                  ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-rose-500"
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
            className="p-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
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
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-semibold text-amber-300">Email sync paused</span>
                  <span className="text-amber-200/90 ml-1.5">
                    Start Docker to resume real-time webhook processing
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyDockerCmd}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface/80 border border-amber-500/30 text-text-primary text-xs font-mono hover:bg-surface hover:border-amber-400 transition-colors shrink-0"
              >
                {copiedDockerCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5 text-amber-400" />
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
      <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-subtle border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Pipeline Architecture
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-text-secondary mt-0.5 font-medium">
              <span className="text-text-primary font-semibold">AI Classification:</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border-subtle text-text-primary text-xs font-mono">
                Tier 1 (rules)
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
              <span className="px-2 py-0.5 rounded-md bg-surface-elevated border border-border-subtle text-text-primary text-xs font-mono">
                Tier 2 (HuggingFace)
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
              <span className="px-2 py-0.5 rounded-md bg-brand-subtle border border-brand/25 text-brand text-xs font-mono font-bold">
                Tier 3 (Gemini 2.5 Flash Lite)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 & 2: Connected Gmail Accounts Card */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-6 flex flex-col gap-6 shadow-elevation-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand" />
              <h2 className="text-base font-semibold text-text-primary">
                Connected Gmail Accounts
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-elevated border border-border-subtle text-text-secondary">
                {accounts.length}/4
              </span>
            </div>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Connect inboxes to allow BriefMail to read, categorize, and prioritize your emails.
            </p>
          </div>

          {/* SECTION 2: Add Gmail Account Button (Top desktop / action bar) */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <motion.button
              whileTap={maxAccountsReached ? undefined : { scale: 0.98 }}
              disabled={maxAccountsReached}
              onClick={() => {
                window.location.href = "/api/gmail/auth";
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-ui font-semibold text-sm transition-all shadow-elevation-1 ${
                maxAccountsReached
                  ? "bg-surface-elevated border border-border-subtle text-text-disabled cursor-not-allowed"
                  : "bg-brand text-text-primary hover:bg-brand-hover shadow-brand-glow"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {maxAccountsReached ? "Maximum accounts connected" : "+ Connect Gmail Account"}
              </span>
            </motion.button>
            <span className="text-[11px] text-text-muted">
              {maxAccountsReached
                ? "Account limit reached (4 of 4)"
                : "You can connect up to 4 Gmail accounts"}
            </span>
          </div>
        </div>

        {/* Accounts List / Skeleton / Empty State */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            /* Loading Skeleton: 3 placeholder cards */
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-surface-elevated/60 border border-border-subtle animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-surface-overlay/80 shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="w-40 sm:w-56 h-4 rounded bg-surface-overlay/80" />
                      <div className="w-24 h-3 rounded bg-surface-overlay/50" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/50">
                    <div className="w-16 h-6 rounded-full bg-surface-overlay/60" />
                    <div className="w-12 h-6 rounded-full bg-surface-overlay/60" />
                    <div className="w-8 h-8 rounded-lg bg-surface-overlay/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 px-4 flex flex-col items-center justify-center text-center rounded-xl bg-surface-elevated/30 border border-dashed border-border-strong/60"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-subtle border border-brand/20 flex items-center justify-center text-brand mb-4 shadow-brand-glow">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-text-primary">
                No Gmail accounts connected yet
              </h3>
              <p className="text-xs sm:text-sm text-text-muted max-w-md mt-1.5 mb-6 leading-relaxed">
                Connect your first Gmail inbox to start automated triage, instant categorization,
                and background action extraction.
              </p>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  window.location.href = "/api/gmail/auth";
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-ui font-semibold text-sm bg-brand text-text-primary hover:bg-brand-hover shadow-brand-glow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Gmail Account</span>
              </motion.button>
            </motion.div>
          ) : (
            /* Connected Accounts Cards with Framer Motion stagger */
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
              {accounts.map((account, index) => {
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
                    className="group relative p-4 rounded-xl bg-surface-elevated border border-border-subtle hover:border-border-strong transition-all shadow-elevation-1"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Avatar & Account Meta */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-text-primary font-bold text-sm shadow-sm shrink-0 border border-brand/30">
                          {initialLetter}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-text-primary truncate">
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
                              <span className="text-text-secondary font-medium">
                                {formatRelativeTime(account.last_synced_at)}
                              </span>
                            </span>

                            {/* Watch Expiry Warning */}
                            {expiring && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-amber-400" />
                                ⚠ Sync expiring soon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Badge, Toggle Switch, Remove Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                        {/* Status Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                            account.sync_enabled
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-surface-overlay text-text-muted border border-border-subtle"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              account.sync_enabled ? "bg-emerald-400" : "bg-text-muted"
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
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-elevated disabled:opacity-50 ${
                              account.sync_enabled ? "bg-brand" : "bg-surface-overlay"
                            }`}
                          >
                            <span className="sr-only">Toggle Sync</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                account.sync_enabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => setAccountToDelete(account)}
                          title="Disconnect account"
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
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

      {/* Confirmation Dialog for Delete */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border-strong p-6 shadow-elevation-3 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Disconnect Gmail Account
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    This will stop synchronization for this inbox.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle text-xs text-text-secondary leading-relaxed">
                Are you sure you want to disconnect{" "}
                <span className="font-bold text-text-primary">
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-colors disabled:opacity-50"
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
        <div className="max-w-4xl mx-auto flex flex-col gap-6 font-ui animate-pulse">
          <div className="h-10 w-48 rounded-lg bg-surface-elevated" />
          <div className="h-64 rounded-2xl bg-surface" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
