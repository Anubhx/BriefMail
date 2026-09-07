"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmailListItem } from "@/components/email/EmailListItem";
import { EmailDetail, LiveEmailDetail } from "@/components/email/EmailDetail";
import {
  RefreshCw,
  Search,
  Clock,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  BellOff,
} from "lucide-react";

interface EmailsApiResponse {
  emails: LiveEmailDetail[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  category_counts: Record<string, number>;
}

export default function SnoozedPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeEmailModal, setActiveEmailModal] = useState<LiveEmailDetail | null>(null);
  const [allFetchedEmails, setAllFetchedEmails] = useState<LiveEmailDetail[]>([]);

  // 1. Fetch snoozed emails (is_snoozed=true)
  const { data, isLoading, isFetching, refetch } = useQuery<EmailsApiResponse>({
    queryKey: ["emails-snoozed", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        is_snoozed: "true",
        page: String(page),
        limit: "50",
      });
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      const res = await fetch(`/api/emails?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load snoozed emails");
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

  // 3. Actions: Archive, Snooze, Star, Unsnooze
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/emails/${id}/archive`, { method: "PATCH" });
    },
    onSuccess: (_, id) => {
      setAllFetchedEmails((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmailId === id) setSelectedEmailId(null);
      if (activeEmailModal?.id === id) setActiveEmailModal(null);
      queryClient.invalidateQueries({ queryKey: ["emails-snoozed"] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({
      id,
      snoozeUntil,
      isSnoozed,
    }: {
      id: string;
      snoozeUntil?: string | null;
      isSnoozed?: boolean;
    }) => {
      await fetch(`/api/emails/${id}/snooze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snooze_until: snoozeUntil,
          is_snoozed: isSnoozed,
        }),
      });
    },
    onSuccess: (_, { id, isSnoozed }) => {
      if (isSnoozed === false) {
        // Removed from snoozed list
        setAllFetchedEmails((prev) => prev.filter((e) => e.id !== id));
        if (selectedEmailId === id) setSelectedEmailId(null);
        if (activeEmailModal?.id === id) setActiveEmailModal(null);
      }
      queryClient.invalidateQueries({ queryKey: ["emails-snoozed"] });
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
      queryClient.invalidateQueries({ queryKey: ["emails-snoozed"] });
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
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              Snoozed
            </h1>
            <p className="text-xs text-text-muted">
              Messages deferred until a later time or date
            </p>
          </div>
        </div>

        {/* Search & Refresh Controls */}
        <div className="flex items-center gap-2 px-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder="Search snoozed..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded border border-border bg-surface-primary text-xs text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh Snoozed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-brand" : "text-text-muted"}`} />
            <span className="hidden sm:inline font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane (Split on Desktop) */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Email List Column */}
        <div className="flex-1 lg:w-[420px] lg:flex-initial flex flex-col bg-surface rounded-lg border border-border overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-secondary">
            <h2 className="text-xs font-ui font-semibold text-text-primary uppercase tracking-wider">
              Snoozed Items
            </h2>
            <span className="text-[11px] font-mono text-text-muted">
              {data?.total ?? allFetchedEmails.length} messages
            </span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && page === 1 ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-4 space-y-2.5 animate-pulse bg-surface"
                >
                  <div className="flex justify-between">
                    <div className="h-3.5 w-32 bg-surface-subtle rounded" />
                    <div className="h-3 w-12 bg-surface-subtle rounded" />
                  </div>
                  <div className="h-3.5 w-52 bg-surface-secondary rounded" />
                  <div className="h-3 w-full bg-surface-subtle rounded" />
                </div>
              ))}
            </div>
          ) : allFetchedEmails.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center flex flex-col items-center justify-center bg-surface">
              <div className="h-11 w-11 rounded-full bg-surface-subtle border border-border text-text-muted flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-text-muted" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary font-ui">
                No snoozed messages
              </h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
                {searchQuery
                  ? "No snoozed emails match your search query."
                  : "Emails you snooze will safely sleep here until their scheduled time."}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-xs text-text-secondary transition-colors"
              >
                <RefreshCw className="h-3 w-3 text-brand" />
                <span>Check for emails</span>
              </button>
            </div>
          ) : (
            /* Continuous Email List Items */
            <div className="flex-1 overflow-y-auto">
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
                    snoozeMutation.mutate({ id, isSnoozed: true, snoozeUntil: defaultSnooze });
                  }}
                  onStar={(id) => starMutation.mutate({ id, isStarred: !email.is_starred })}
                />
              ))}

              {/* Load More Pagination Button */}
              {data?.hasMore && (
                <div className="p-3 text-center border-t border-border bg-surface-secondary">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded border border-border bg-surface hover:bg-surface-subtle text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    <span>{isFetching ? "Loading..." : "Load more messages"}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Reading Pane (Split on lg screens) */}
        <div className="hidden lg:flex flex-1 bg-surface rounded-lg border border-border p-8 flex-col justify-start overflow-y-auto min-h-[600px]">
          {selectedEmail ? (
            <div className="flex flex-col gap-6 max-w-prose">
              {/* Header Details */}
              <div className="border-b border-border pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-ui font-medium uppercase tracking-wider text-brand">
                    {(selectedEmail.category || "General").replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        snoozeMutation.mutate({
                          id: selectedEmail.id,
                          isSnoozed: false,
                        })
                      }
                      className="px-3 py-1 rounded border border-border bg-surface hover:bg-surface-subtle text-xs font-ui text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                      title="Return email to inbox now"
                    >
                      <BellOff className="h-3.5 w-3.5 text-text-muted" />
                      <span>Unsnooze</span>
                    </button>
                    <button
                      onClick={() => archiveMutation.mutate(selectedEmail.id)}
                      className="px-3 py-1 rounded border border-border bg-surface hover:bg-surface-subtle text-xs font-ui text-text-secondary hover:text-text-primary transition-colors"
                    >
                      Archive
                    </button>
                  </div>
                </div>

                <h1 className="font-serif text-2xl md:text-3xl text-text-primary font-normal leading-tight tracking-tight">
                  {selectedEmail.subject || "(No subject)"}
                </h1>

                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-surface-subtle border border-border text-text-secondary flex items-center justify-center font-semibold text-xs uppercase">
                      {(selectedEmail.from_name || selectedEmail.from_email || "?").charAt(0)}
                    </div>
                    <div>
                      <span className="text-text-primary font-medium">
                        {selectedEmail.from_name || selectedEmail.from_email}
                      </span>
                      {selectedEmail.from_email && (
                        <span className="font-mono text-text-muted text-[11px] ml-1.5">
                          &lt;{selectedEmail.from_email}&gt;
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {selectedEmail.snoozed_until && (
                      <span className="px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border">
                        Until {new Date(selectedEmail.snoozed_until).toLocaleString()}
                      </span>
                    )}
                    <span className="text-text-muted">
                      {selectedEmail.received_at
                        ? new Date(selectedEmail.received_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Summary Banner - Restrained parchment note */}
              {selectedEmail.ai_summary && (
                <div className="p-4 rounded border-l-2 border-brand bg-surface-secondary space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-ui font-semibold uppercase tracking-wider text-brand">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Summary</span>
                  </div>
                  <p className="font-serif italic text-sm text-text-secondary leading-relaxed">
                    {selectedEmail.ai_summary}
                  </p>
                </div>
              )}

              {/* Action Items Box */}
              {selectedEmail.has_action_item &&
                selectedEmail.action_items &&
                selectedEmail.action_items.length > 0 && (
                  <div className="p-4 rounded border border-border bg-surface-secondary space-y-2">
                    <span className="text-xs font-ui font-semibold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      Action Items Required
                    </span>
                    <div className="space-y-1.5 text-xs font-ui">
                      {selectedEmail.action_items.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-text-secondary">
                          <span className="text-emerald-700 font-bold">•</span>
                          <span>{action.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Body Content */}
              <div className="pt-2 text-text-primary leading-relaxed">
                {selectedEmail.body_html ? (
                  <div
                    className="prose prose-neutral max-w-none text-[15px] sm:text-base leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                  />
                ) : selectedEmail.body_text ? (
                  <div className="font-ui text-[15px] sm:text-base whitespace-pre-wrap leading-relaxed text-text-primary">
                    {selectedEmail.body_text}
                  </div>
                ) : (
                  <div className="italic text-text-muted text-sm">{selectedEmail.snippet}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm font-ui gap-2">
              <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-text-muted">
                <Clock className="w-5 h-5 text-text-muted" />
              </div>
              <span>Select a snoozed email to view full content</span>
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
