"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Filter,
  SlidersHorizontal,
  X,
  Calendar,
  Layers,
  User,
  Check,
  RotateCcw,
} from "lucide-react";

interface EmailsApiResponse {
  emails: LiveEmailDetail[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  category_counts: Record<string, number>;
}

interface GmailAccount {
  id: string;
  email: string;
  display_name?: string | null;
}

const CATEGORY_OPTIONS = [
  { id: "finance", label: "Finance", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "finance_transaction", label: "Transactions", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "investments", label: "Investments", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "career", label: "Career", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "jobs", label: "Jobs", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  { id: "meetings", label: "Meetings", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "otp", label: "OTP & Codes", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "social", label: "Social", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  { id: "newsletter", label: "Newsletters", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  { id: "ads", label: "Ads & Promo", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { id: "system", label: "System", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  { id: "misc", label: "Misc", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
];

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
  { id: "starred", label: "Starred" },
  { id: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { label: "Date (Newest first)", sort: "received_at", order: "desc" },
  { label: "Date (Oldest first)", sort: "received_at", order: "asc" },
  { label: "Sender (A-Z)", sort: "from_name", order: "asc" },
  { label: "Subject (A-Z)", sort: "subject", order: "asc" },
];

function addTargetBlank(html: string): string {
  return html.replace(
    /<a\s/gi,
    '<a target="_blank" rel="noopener noreferrer" '
  );
}

export default function AllMailPage() {
  const queryClient = useQueryClient();

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeEmailModal, setActiveEmailModal] = useState<LiveEmailDetail | null>(null);
  const [allFetchedEmails, setAllFetchedEmails] = useState<LiveEmailDetail[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("received_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  // Filter Panel visibility & state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // Fetch Connected Gmail Accounts
  const { data: accountsData } = useQuery<GmailAccount[]>({
    queryKey: ["gmail-accounts-list"],
    queryFn: async () => {
      const res = await fetch("/api/settings/gmail-accounts");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.accounts || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const accounts = accountsData || [];

  // Reset pagination to page 1 whenever filters change
  const handleFilterChange = () => {
    setPage(1);
  };

  // Toggle Category selection
  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
    handleFilterChange();
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSelectedAccountId("all");
    setPage(1);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (statusFilter !== "all") count += 1;
    if (dateFrom) count += 1;
    if (dateTo) count += 1;
    if (selectedAccountId && selectedAccountId !== "all") count += 1;
    return count;
  }, [selectedCategories, statusFilter, dateFrom, dateTo, selectedAccountId]);

  // Main email query with all filter, sort, search params
  const { data, isLoading, isFetching, refetch } = useQuery<EmailsApiResponse>({
    queryKey: [
      "emails-all-mail",
      page,
      searchQuery,
      sortBy,
      sortOrder,
      selectedCategories.join(","),
      statusFilter,
      dateFrom,
      dateTo,
      selectedAccountId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        sort: sortBy,
        order: sortOrder,
      });

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (selectedCategories.length > 0) {
        params.set("category", selectedCategories.join(","));
      } else {
        params.set("category", "all");
      }

      if (statusFilter === "unread") {
        params.set("is_read", "false");
      } else if (statusFilter === "read") {
        params.set("is_read", "true");
      } else if (statusFilter === "starred") {
        params.set("is_starred", "true");
      } else if (statusFilter === "archived") {
        params.set("is_archived", "true");
      } else if (statusFilter === "all") {
        params.set("is_archived", "all");
      }

      if (dateFrom) {
        params.set("date_from", dateFrom);
      }
      if (dateTo) {
        params.set("date_to", dateTo);
      }
      if (selectedAccountId && selectedAccountId !== "all") {
        params.set("gmail_account_id", selectedAccountId);
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

  // Keep list accumulated if paginating, or reset when filters/search change
  useEffect(() => {
    if (data?.emails) {
      if (page === 1) {
        setAllFetchedEmails(data.emails);
        if (data.emails.length > 0) {
          setSelectedEmailId(data.emails[0].id);
        } else {
          setSelectedEmailId(null);
        }
      } else {
        setAllFetchedEmails((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = data.emails.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data, page]);

  // Single full email detail query on selection
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

  // Actions: Archive, Snooze, Star
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

  // Quick Date Range helper
  const setPresetDateRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    setDateTo(to.toISOString().split("T")[0]);
    setDateFrom(from.toISOString().split("T")[0]);
    handleFilterChange();
  };

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto h-full font-ui pb-8">
      {/* Top Header Bar */}
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
              Unified inbox, archive, and smart filtered mail stream
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

      {/* Sort & Filter Action Bar (Always Visible) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-surface border border-white/10 shadow-xs">
        {/* Left: Sort Bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted font-medium flex items-center gap-1 pl-1">
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand" />
            <span className="hidden sm:inline">Sort by:</span>
          </span>
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(":");
              setSortBy(s);
              setSortOrder(o);
              setPage(1);
            }}
            className="bg-surface-elevated border border-white/10 text-text-primary rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-brand cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={`${opt.sort}:${opt.order}`} value={`${opt.sort}:${opt.order}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-all ${
              isFilterPanelOpen || activeFiltersCount > 0
                ? "bg-brand/10 border-brand text-brand shadow-xs"
                : "bg-surface-elevated hover:bg-surface-overlay border-white/10 text-text-secondary hover:text-text-primary"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-brand text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isFilterPanelOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {isFilterPanelOpen && (
        <div className="p-4 rounded-xl bg-surface border border-brand/20 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Filter Mail
              </h3>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="text-[11px] text-brand hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1. Date Range Section */}
            <div className="space-y-2 p-3 rounded-lg bg-surface-elevated/40 border border-white/5">
              <label className="font-semibold text-text-primary flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-brand" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-text-muted block mb-1">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full bg-surface border border-white/10 rounded-md p-1.5 text-xs text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block mb-1">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full bg-surface border border-white/10 rounded-md p-1.5 text-xs text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => setPresetDateRange(7)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-overlay text-[11px] text-text-secondary border border-white/5"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => setPresetDateRange(30)}
                  className="px-2 py-0.5 rounded bg-surface hover:bg-surface-overlay text-[11px] text-text-secondary border border-white/5"
                >
                  Last 30 days
                </button>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      handleFilterChange();
                    }}
                    className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[11px]"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </div>

            {/* 2. Status Selector */}
            <div className="space-y-2 p-3 rounded-lg bg-surface-elevated/40 border border-white/5">
              <label className="font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-brand" />
                Status
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {STATUS_OPTIONS.map((st) => {
                  const isSelected = statusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        setStatusFilter(st.id);
                        handleFilterChange();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-brand text-white border-brand shadow-xs"
                          : "bg-surface hover:bg-surface-overlay text-text-secondary border-white/10"
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Connected Gmail Account */}
            <div className="space-y-2 p-3 rounded-lg bg-surface-elevated/40 border border-white/5">
              <label className="font-semibold text-text-primary flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand" />
                Gmail Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  handleFilterChange();
                }}
                className="w-full bg-surface border border-white/10 text-text-primary rounded-md p-1.5 text-xs focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">All Connected Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.email} {acc.display_name ? `(${acc.display_name})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-text-muted">
                Filter stream to emails delivered to a specific mailbox
              </p>
            </div>
          </div>

          {/* 4. Multi-select Categories */}
          <div className="space-y-2 p-3 rounded-lg bg-surface-elevated/40 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-text-primary text-xs">
                Categories (Multi-Select)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCategories(CATEGORY_OPTIONS.map((c) => c.id));
                    handleFilterChange();
                  }}
                  className="text-[10px] text-brand hover:underline"
                >
                  Select All
                </button>
                <span className="text-white/20">•</span>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    handleFilterChange();
                  }}
                  className="text-[10px] text-text-muted hover:text-text-primary"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-all text-left ${
                      isSelected
                        ? `${cat.color} font-semibold shadow-xs`
                        : "bg-surface hover:bg-surface-overlay text-text-muted border-white/10"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isSelected && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips (Always visible if any filter applied) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 py-0.5">
          <span className="text-[11px] text-text-muted font-medium mr-1">Active filters:</span>

          {/* Category Chips */}
          {selectedCategories.map((catId) => {
            const catObj = CATEGORY_OPTIONS.find((c) => c.id === catId);
            return (
              <span
                key={catId}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-brand/10 text-brand border border-brand/20 font-medium"
              >
                Category: {catObj ? catObj.label : catId}
                <button
                  onClick={() => toggleCategory(catId)}
                  className="hover:text-white p-0.5 rounded-full"
                  title="Remove filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          {/* Status Chip */}
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-brand/10 text-brand border border-brand/20 font-medium">
              Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <button
                onClick={() => {
                  setStatusFilter("all");
                  handleFilterChange();
                }}
                className="hover:text-white p-0.5 rounded-full"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Date Chips */}
          {dateFrom && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-brand/10 text-brand border border-brand/20 font-medium">
              From: {dateFrom}
              <button
                onClick={() => {
                  setDateFrom("");
                  handleFilterChange();
                }}
                className="hover:text-white p-0.5 rounded-full"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-brand/10 text-brand border border-brand/20 font-medium">
              To: {dateTo}
              <button
                onClick={() => {
                  setDateTo("");
                  handleFilterChange();
                }}
                className="hover:text-white p-0.5 rounded-full"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Account Chip */}
          {selectedAccountId && selectedAccountId !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-brand/10 text-brand border border-brand/20 font-medium">
              Account: {accounts.find((a) => a.id === selectedAccountId)?.email || "Account"}
              <button
                onClick={() => {
                  setSelectedAccountId("all");
                  handleFilterChange();
                }}
                className="hover:text-white p-0.5 rounded-full"
                title="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {/* Clear All action */}
          <button
            onClick={handleClearAllFilters}
            className="text-xs text-text-muted hover:text-text-primary underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Content Pane (Split on Desktop) */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Email List Column */}
        <div className="flex-1 lg:w-[420px] lg:flex-initial flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between px-2 mb-1">
            <h2 className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wider">
              Messages
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
                {searchQuery || activeFiltersCount > 0
                  ? "No messages match your active filters or search query."
                  : "All your ingested and classified emails will appear here."}
              </p>
              <div className="flex items-center gap-2 mt-4">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated text-xs text-text-secondary border border-white/10 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3 text-brand" />
                    <span>Reset filters</span>
                  </button>
                )}
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-xs text-text-secondary border border-white/10 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 text-brand" />
                  <span>Check for emails</span>
                </button>
              </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand/20">
                      {selectedEmail.category || "General"}
                    </span>
                    {selectedEmail.subcategory && (
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-white/5">
                        {selectedEmail.subcategory}
                      </span>
                    )}
                  </div>
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

              {/* Body Content with links opening in new tab */}
              <div className="pt-2 text-sm text-text-secondary leading-relaxed font-sans overflow-x-auto">
                {selectedEmail.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: addTargetBlank(selectedEmail.body_html) }} />
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
