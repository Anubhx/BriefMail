"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CareerStatsBar } from "@/components/career/CareerStatsBar";
import { KanbanBoard } from "@/components/career/KanbanBoard";
import { AddApplicationModal } from "@/components/career/AddApplicationModal";
import { ApplicationWithOffer } from "@/components/career/OfferDetailsPanel";
import {
  Briefcase,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
} from "lucide-react";

export default function CareerPage() {
  const [applications, setApplications] = useState<ApplicationWithOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch applications
  const fetchApplications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/career/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filtered applications based on search query
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase().trim();
    return applications.filter(
      (app) =>
        app.company_name.toLowerCase().includes(q) ||
        (app.role_title && app.role_title.toLowerCase().includes(q)) ||
        app.current_stage.toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  // Compute stats
  const stats = useMemo(() => {
    const total = applications.length;
    const active = applications.filter(
      (a) => a.current_stage !== "rejected" && a.current_stage !== "withdrawn"
    ).length;
    const offers = applications.filter(
      (a) => a.current_stage === "offered"
    ).length;
    const interviewedOrOffered = applications.filter(
      (a) => a.current_stage === "interviewing" || a.current_stage === "offered"
    ).length;
    const interviewRate =
      total > 0 ? Math.round((interviewedOrOffered / total) * 100) : 0;

    return { total, active, offers, interviewRate };
  }, [applications]);

  // Helper to detect job alert cards
  const isJobAlertApplication = useCallback((app: ApplicationWithOffer): boolean => {
    const isEmail =
      Boolean(app.email_id) ||
      app.job_board?.toLowerCase() === "email" ||
      (app as any).source?.toLowerCase() === "email";
    if (!isEmail) return false;

    const company = (app.company_name || "").toLowerCase();
    const companyMatches =
      company.includes("internshala") ||
      company.includes("indeed") ||
      company.includes("naukri");

    const emailObj = Array.isArray(app.emails) ? app.emails[0] : app.emails;
    const subject = (
      emailObj?.subject ||
      (app as any).subject ||
      ""
    ).toLowerCase();

    const subjectMatches =
      subject.includes("alert") ||
      subject.includes("new jobs") ||
      subject.includes("vacancy");

    return companyMatches || subjectMatches;
  }, []);

  const appliedJobAlertsCount = useMemo(() => {
    return applications.filter(
      (app) => app.current_stage === "applied" && isJobAlertApplication(app)
    ).length;
  }, [applications, isJobAlertApplication]);

  const handleDeleteApplication = useCallback(async (id: string) => {
    // Optimistic update: remove card from local state immediately (don't wait for refetch)
    setApplications((prev) => prev.filter((app) => app.id !== id));
    try {
      const res = await fetch(`/api/career/applications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Failed to delete application from server:", await res.text());
      }
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  }, []);

  const handleClearJobAlerts = useCallback(async () => {
    const alertCardsInApplied = applications.filter(
      (app) => app.current_stage === "applied" && isJobAlertApplication(app)
    );

    const alertCards =
      alertCardsInApplied.length > 0
        ? alertCardsInApplied
        : applications.filter(isJobAlertApplication);

    const ids = alertCards.map((a) => a.id);
    if (ids.length === 0) {
      window.alert("No job alert cards found in the Applied column.");
      return;
    }

    const confirmed = window.confirm(
      `Clear ${ids.length} job alert${ids.length > 1 ? "s" : ""} from Applied?`
    );
    if (!confirmed) return;

    // Optimistic update: remove cards from local state immediately
    setApplications((prev) => prev.filter((app) => !ids.includes(app.id)));

    try {
      const res = await fetch("/api/career/applications/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        console.error("Failed to bulk delete job alerts:", await res.text());
      }
    } catch (err) {
      console.error("Error bulk deleting job alerts:", err);
    }
  }, [applications, isJobAlertApplication]);

  return (
    <div className="flex flex-col gap-5 w-full max-w-[1600px] mx-auto pb-12 select-none font-ui">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl text-text-primary tracking-tight font-normal">
              Career Pipeline
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface-secondary text-text-muted border border-border-default">
              Auto-Tracked
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Track job applications, interview timelines, and offer letters automatically synced from your emails.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchApplications(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-surface-secondary border border-border-default text-text-secondary hover:text-text-primary text-xs font-medium transition-colors shadow-xs"
            title="Refresh applications"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand" : "text-text-muted"}`}
            />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <CareerStatsBar
        total={stats.total}
        active={stats.active}
        offers={stats.offers}
        interviewRate={stats.interviewRate}
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-lg bg-surface border border-border-default shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search company, role, or stage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-surface-secondary text-xs font-ui text-text-primary placeholder:text-text-muted border border-border-default focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-text-muted hover:text-text-primary underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Main Kanban Board or Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[480px] rounded-lg bg-surface-secondary/70 border border-border-default animate-pulse p-3 flex flex-col gap-2.5"
            >
              <div className="h-4 w-20 bg-surface rounded" />
              <div className="h-24 bg-surface rounded-lg border border-border-default" />
              <div className="h-24 bg-surface rounded-lg border border-border-default" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          applications={filteredApplications}
          onApplicationsChange={setApplications}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onDeleteApplication={handleDeleteApplication}
          onClearJobAlerts={handleClearJobAlerts}
          jobAlertsCount={appliedJobAlertsCount}
        />
      )}

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onApplicationCreated={() => fetchApplications(true)}
      />
    </div>
  );
}
