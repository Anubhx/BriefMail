"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MeetingCard, MeetingData } from "@/components/meetings/MeetingCard";
import {
  Calendar,
  Video,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { differenceInMinutes, parseISO, isValid, format } from "date-fns";

export default function MeetingsPage() {
  const [upcoming, setUpcoming] = useState<MeetingData[]>([]);
  const [past, setPast] = useState<MeetingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Quick add form state
  const [newTitle, setNewTitle] = useState("");
  const [newHost, setNewHost] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newPlatform, setNewPlatform] = useState<"meet" | "zoom" | "teams" | "other">("meet");
  const [creating, setCreating] = useState(false);

  const fetchMeetings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/meetings");
      if (res.ok) {
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
      }
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Identify next upcoming meeting within next 30 minutes or happening now
  const nextMeetingSoon = useMemo(() => {
    const now = new Date();
    return upcoming.find((m) => {
      if (!m.start_time) return false;
      const start = parseISO(m.start_time);
      if (!isValid(start)) return false;
      const diff = differenceInMinutes(start, now);
      return diff <= 30 && diff >= -60;
    });
  }, [upcoming]);

  // Search filter
  const filterList = useCallback(
    (list: MeetingData[]) => {
      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.organizer_name && m.organizer_name.toLowerCase().includes(q)) ||
          (m.organizer_email && m.organizer_email.toLowerCase().includes(q)) ||
          (m.platform && m.platform.toLowerCase().includes(q))
      );
    },
    [searchQuery]
  );

  const filteredUpcoming = useMemo(() => filterList(upcoming), [upcoming, filterList]);
  const filteredPast = useMemo(() => filterList(past), [past, filterList]);


  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartTime) return;
    setCreating(true);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          organizer_name: newHost.trim() || undefined,
          start_time: new Date(newStartTime).toISOString(),
          meeting_link: newLink.trim() || undefined,
          platform: newPlatform,
        }),
      });

      if (res.ok) {
        setNewTitle("");
        setNewHost("");
        setNewStartTime("");
        setNewLink("");
        setIsAddModalOpen(false);
        fetchMeetings(true);
      }
    } catch (err) {
      console.error("Failed to create meeting:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Meetings & Schedule
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-purple-50 text-purple-800 border border-purple-200">
              <Calendar className="h-3 w-3 text-purple-600" />
              Auto-Extracted
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            All Google Meet, Zoom, and Teams invites synced directly from incoming invitations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchMeetings(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-default text-text-primary text-xs font-medium transition-colors shadow-xs"
            title="Refresh schedule"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-accent-action" : "text-text-muted"}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-text-primary hover:bg-text-primary/90 text-white text-xs sm:text-sm font-medium transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Meeting</span>
          </button>
        </div>
      </div>

      {/* QUICK JOIN HERO BANNER (If meeting is in next 30 mins or happening now) */}
      {nextMeetingSoon && (
        <div className="relative overflow-hidden rounded-2xl bg-emerald-50/60 p-5 sm:p-6 border border-emerald-200/80 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-ping" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                  Quick Join — Next Up
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-text-primary">
                {nextMeetingSoon.title}
              </h2>
              <p className="text-xs text-text-muted flex items-center gap-2">
                <span>Host: {nextMeetingSoon.organizer_name || nextMeetingSoon.organizer_email || "Scheduled"}</span>
                {nextMeetingSoon.start_time && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-800 font-mono font-medium">
                      Starts {format(parseISO(nextMeetingSoon.start_time), "h:mm a")}
                    </span>
                  </>
                )}
              </p>
            </div>

            {nextMeetingSoon.meeting_link && (
              <a
                href={nextMeetingSoon.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-xs transition-all shrink-0"
              >
                <Video className="h-4 w-4" />
                <span>Join Now</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-default">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "upcoming"
                ? "bg-surface-elevated text-text-primary shadow-xs"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Upcoming ({upcoming.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "past"
                ? "bg-surface-elevated text-text-primary shadow-xs"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Past ({past.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search meetings by title or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface-elevated border border-border-default text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-surface-elevated border border-border-default animate-pulse p-6"
            />
          ))}
        </div>
      ) : activeTab === "upcoming" ? (
        filteredUpcoming.length > 0 ? (
          <div className="space-y-4">
            {filteredUpcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} isPast={false} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-default bg-surface-elevated p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 border border-purple-200">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-text-primary">
              No upcoming meetings
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              When meeting invites from Google Meet, Zoom, or Teams arrive in your inbox, they will appear here automatically.
            </p>
          </div>
        )
      ) : filteredPast.length > 0 ? (
        <div className="space-y-4">
          {filteredPast.map((m) => (
            <MeetingCard key={m.id} meeting={m} isPast={true} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border-default bg-surface-elevated p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-surface-subtle text-text-muted flex items-center justify-center mb-3 border border-border-default">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-text-primary">
            No past meetings recorded
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Completed meetings will remain archived here for your reference.
          </p>
        </div>
      )}

      {/* Add Meeting Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-surface-elevated border border-border-default rounded-2xl overflow-hidden shadow-lg animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle bg-surface-subtle/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-text-primary">
                    Add Meeting
                  </h2>
                  <p className="text-xs text-text-muted">
                    Record a schedule or calendar invite
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Review / Standup"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg bg-surface-subtle border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Organizer / Host
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                  className="w-full rounded-lg bg-surface-subtle border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Date & Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-lg bg-surface-subtle border border-border-default px-3 py-2 text-xs font-mono text-text-primary focus:border-border-hover focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Platform
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full rounded-lg bg-surface-subtle border border-border-default px-3 py-2 text-xs text-text-primary focus:border-border-hover focus:outline-none"
                  >
                    <option value="meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Meeting Link URL
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full rounded-lg bg-surface-subtle border border-border-default px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border-default text-text-secondary hover:bg-surface-subtle text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-text-primary hover:bg-text-primary/90 text-white text-xs font-medium shadow-xs disabled:opacity-50 transition-colors"
                >
                  {creating ? "Adding..." : "Save Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
