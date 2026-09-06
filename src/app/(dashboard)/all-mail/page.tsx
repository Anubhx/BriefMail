"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmailListItem } from "@/components/email/EmailListItem";
import { EmailDetail, LiveEmailDetail } from "@/components/email/EmailDetail";
import {
  RefreshCw,
  Search,
  Mail,
  Sparkles,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

interface EmailsApiResponse {
  emails: LiveEmailDetail[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  category_counts: Record<string, number>;
}

export default function AllMailPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeEmailModal, setActiveEmailModal] = useState<LiveEmailDetail | null>(null);
  const [allFetchedEmails, setAllFetchedEmails] = useState<LiveEmailDetail[]>([]);

  // 1. Fetch all emails (category=all)
  const { data, isLoading, isFetching, refetch } = useQuery<EmailsApiResponse>({
    queryKey: ["emails-all-mail", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: "all",
        page: String(page),
        limit: "50",
      });
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      const res = await fetch(`/api/emails?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load all mail");
      }
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Keep list accumulated if paginating, or reset when search changes
  React.useEffect(() => {
    if (data?.emails) {
      if (page === 1) {
        setAllFetchedEmails(data.emails);
        if (!selectedEmailId && data.emails.length > 0) {
          setSelectedEmailId(data.emails[0].id);
        }
      } else {
        setAllFetchedEmails((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = data.emails.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data, page, selectedEmailId]);

  // 2. Fetch Single Full Email on click/select
  const { data: fullEmailData } = useQuery<{ email: LiveEmailDetail }>({
    queryKey: ["email-detail", selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) throw new Error("No id");
      const res = await fetch(`/api/emails/${selectedEmailId}`);
      if (!res.ok) throw new Error("Failed to load email detail");
      return res.json();
    },
    enabled: !!selectedEmailId,
    staleTime: 60 * 1000,
  });

  const selectedEmail =
    fullEmailData?.email || allFetchedEmails.find((e) => e.id === selectedEmailId) || null;

  // 3. Actions: Archive, Snooze, Star
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/emails/${id}/archive`, { method: "PATCH" });
    },
    onSuccess: (_, id) => {
      setAllFetchedEmails((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmailId === id) setSelectedEmailId(null);
      if (activeEmailModal?.id === id) setActiveEmailModal(null);
      queryClient.invalidateQueries({ queryKey: ["emails-all-mail"] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, snoozeUntil }: { id: string; snoozeUntil: string }) => {
      await fetch(`/api/emails/${id}/snooze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snooze_until: snoozeUntil }),
      });
    },
    onSuccess: (_, { id }) => {
      setAllFetchedEmails((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmailId === id) setSelectedEmailId(null);
      if (activeEmailModal?.id === id) setActiveEmailModal(null);
      queryClient.invalidateQueries({ queryKey: ["emails-all-mail"] });
    },
  });

  const starMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      await fetch(`/api/emails/${id}/star`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: isStarred }),
      });
    },
    onSuccess: (_, { id, isStarred }) => {
      setAllFetchedEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_starred: isStarred } : e))
      );
      queryClient.invalidateQueries({ queryKey: ["email-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["emails-all-mail"] });
    },
  });

  const handleEmailClick = (email: LiveEmailDetail) => {
    setSelectedEmailId(email.id);
    setActiveEmailModal(email);
    setAllFetchedEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, is_read: true } : e))
    );
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto h-full font-ui pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-brand-glow">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              All Mail
            </h1>
            <p className="text-xs text-text-muted">
              Unified archive and inbox view across all categories
            </p>
          </div>
        </div>

        {/* Search & Refresh Controls */}
        <div className="flex items-center gap-2 px-1">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search all mail..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-white/10 text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh All Mail"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-brand" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane (Split on Desktop) */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Email List Column */}
        <div className="flex-1 lg:w-[420px] lg:flex-initial flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between px-2 mb-1">
            <h2 className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wider">
              All Messages
            </h2>
            <span className="text-xs font-mono text-text-muted">
              {data?.total ?? allFetchedEmails.length} items
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && page === 1 ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-surface/60 border border-white/5 animate-pulse p-4 space-y-2"
                >
                  <div className="flex justify-between">
                    <div className="h-3 w-28 bg-surface-elevated rounded" />
                    <div className="h-3 w-12 bg-surface-elevated rounded" />
                  </div>
                  <div className="h-3 w-48 bg-surface-elevated/70 rounded" />
                  <div className="h-2.5 w-full bg-surface-elevated/40 rounded" />
                </div>
              ))}
            </div>
          ) : allFetchedEmails.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center border border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center bg-surface/20">
              <div className="h-12 w-12 rounded-2xl bg-surface-elevated text-brand flex items-center justify-center mb-3 shadow-brand-glow">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-text-primary font-ui">
                No mail found
              </h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs">
                {searchQuery ? "No messages match your search query." : "All your ingested and classified emails will appear here."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-xs text-text-secondary border border-white/10 transition-colors"
              >
                <RefreshCw className="h-3 w-3 text-brand" />
                <span>Check for emails</span>
              </button>
            </div>
          ) : (
            /* Email List Items */
            <div className="space-y-2">
              {allFetchedEmails.map((email) => (
                <EmailListItem
                  key={email.id}
                  id={email.id}
                  subject={email.subject}
                  fromName={email.from_name || undefined}
                  fromEmail={email.from_email || undefined}
                  sender={email.from_name || email.from_email || "Unknown"}
                  snippet={email.snippet || ""}
                  receivedAt={email.received_at ? new Date(email.received_at) : undefined}
                  category={email.category || "misc"}
                  subcategory={email.subcategory}
                  isRead={email.is_read}
                  isUnread={!email.is_read}
                  hasActionItem={email.has_action_item}
                  isSelected={selectedEmailId === email.id}
                  onClick={() => handleEmailClick(email)}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  onSnooze={(id) => {
                    const defaultSnooze = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    snoozeMutation.mutate({ id, snoozeUntil: defaultSnooze });
                  }}
                  onStar={(id) => starMutation.mutate({ id, isStarred: !email.is_starred })}
                />
              ))}

              {/* Load More Pagination Button */}
              {data?.hasMore && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-white/10 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <span>{isFetching ? "Loading..." : "Load more emails"}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Reading Pane (Split on lg screens) */}
        <div className="hidden lg:flex flex-1 bg-surface rounded-2xl border border-border-subtle p-6 flex-col justify-between overflow-y-auto shadow-sm min-h-[600px]">
          {selectedEmail ? (
            <div className="flex flex-col gap-4">
              {/* Header Details */}
              <div className="border-b border-border-subtle pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand/20">
                    {selectedEmail.category || "General"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => archiveMutation.mutate(selectedEmail.id)}
                      className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-xs text-text-secondary transition-colors border border-white/5"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        const target = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                        snoozeMutation.mutate({ id: selectedEmail.id, snoozeUntil: target });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-xs text-text-secondary transition-colors border border-white/5"
                    >
                      Snooze 24h
                    </button>
                  </div>
                </div>

                <h1 className="font-ui text-xl font-bold text-text-primary leading-snug">
                  {selectedEmail.subject}
                </h1>

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-brand-subtle text-brand flex items-center justify-center font-bold text-xs uppercase">
                      {(selectedEmail.from_name || selectedEmail.from_email || "?").charAt(0)}
                    </div>
                    <span>
                      <strong className="text-text-primary font-medium">
                        {selectedEmail.from_name || selectedEmail.from_email}
                      </strong>{" "}
                      {selectedEmail.from_email ? `(${selectedEmail.from_email})` : ""}
                    </span>
                  </div>

                  <span className="font-mono text-[11px]">
                    {selectedEmail.received_at
                      ? new Date(selectedEmail.received_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>

              {/* AI Summary Banner */}
              {selectedEmail.ai_summary && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3 shadow-sm">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block mb-1">
                      AI Summary
                    </span>
                    <p className="italic text-text-primary leading-relaxed">
                      {selectedEmail.ai_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Items Box */}
              {selectedEmail.has_action_item &&
                selectedEmail.action_items &&
                selectedEmail.action_items.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Action Items Required
                    </span>
                    <div className="space-y-1 text-xs">
                      {selectedEmail.action_items.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-text-secondary">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{action.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Body Content */}
              <div className="pt-2 text-sm text-text-secondary leading-relaxed font-sans overflow-x-auto">
                {selectedEmail.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                ) : selectedEmail.body_text ? (
                  <div className="whitespace-pre-wrap">{selectedEmail.body_text}</div>
                ) : (
                  <div className="italic text-text-muted">{selectedEmail.snippet}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm font-ui gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
                <Mail className="w-6 h-6 text-text-muted" />
              </div>
              <span>Select an email to view full content</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Modal Sheet (<1024px) */}
      {activeEmailModal && (
        <div className="lg:hidden">
          <EmailDetail
            email={selectedEmail || activeEmailModal}
            onClose={() => setActiveEmailModal(null)}
            onArchive={(id) => archiveMutation.mutate(id)}
            onSnooze={(id, snoozeUntil) => snoozeMutation.mutate({ id, snoozeUntil })}
            onStar={(id, isStarred) => starMutation.mutate({ id, isStarred })}
          />
        </div>
      )}
    </div>
  );
}
