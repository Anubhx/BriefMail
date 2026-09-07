"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ActionBlockGrid, ActionItem } from "@/components/system/ActionBlockGrid";
import { SystemBundle, BundledEmail } from "@/components/system/SystemBundle";
import { ShieldCheck, RefreshCw, Layers, Sparkles } from "lucide-react";

export default function SystemTriagePage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [bundleEmails, setBundleEmails] = useState<BundledEmail[]>([]);
  const [unreadBundleCount, setUnreadBundleCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [actionsRes, bundleRes] = await Promise.all([
        fetch("/api/system/actions"),
        fetch("/api/system/bundle"),
      ]);

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.actions || []);
      }

      if (bundleRes.ok) {
        const bundleData = await bundleRes.json();
        setBundleEmails(bundleData.emails || []);
        setUnreadBundleCount(bundleData.unread_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch system triage data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dismiss action item
  const handleDismissAction = async (id: string) => {
    // Optimistic removal
    setActions((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/system/actions/${id}/dismiss`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to dismiss action item:", err);
    }
  };

  // Mark all bundled notifications as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/system/bundle/read-all", {
        method: "POST",
      });

      if (res.ok) {
        setBundleEmails((prev) => prev.map((e) => ({ ...e, is_read: true })));
        setUnreadBundleCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              System Triage & Action Center
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-subtle text-text-secondary border border-border-default">
              <Sparkles className="h-3 w-3 text-accent-action" />
              Isolated
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            Interactive action blocks isolated directly from raw incoming emails, alongside bundled low-priority notifications.
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-default text-text-primary text-xs font-medium transition-colors shadow-xs"
          title="Refresh system triage"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-accent-action" : "text-text-muted"}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-surface-elevated border border-border-default animate-pulse p-5"
              />
            ))}
          </div>
          <div className="h-20 rounded-2xl bg-surface-elevated border border-border-default animate-pulse" />
        </div>
      ) : (
        <>
          {/* 1. ENTITY ISOLATION: ActionBlockGrid at top */}
          <section>
            <ActionBlockGrid
              actions={actions}
              onDismiss={handleDismissAction}
            />
          </section>

          {/* 2. SYSTEM BUNDLE: Bundled Low-Priority Notifications below */}
          <section className="space-y-3 pt-2 border-t border-border-subtle">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-text-primary flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent-action" />
                Bundled Notifications
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Low-priority platform updates, digests, and workspace notifications separated from your core inbox.
              </p>
            </div>

            <SystemBundle
              emails={bundleEmails}
              unreadCount={unreadBundleCount}
              onMarkAllRead={handleMarkAllRead}
            />
          </section>
        </>
      )}
    </div>
  );
}
