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

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-ui text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Career Copilot
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-subtle text-brand border border-brand/20">
              <Sparkles className="h-3 w-3" />
              AI Pipeline
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            Track job applications, interview timelines, and offer letters automatically synced from your emails.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchApplications(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-DEFAULT hover:bg-surface-elevated border border-white/10 text-text-secondary hover:text-text-primary text-xs font-medium transition-colors"
            title="Refresh applications"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-brand" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-brand-glow"
          >
            <Plus className="h-4 w-4" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Top Stats Bar */}
      <CareerStatsBar
        total={stats.total}
        active={stats.active}
        offers={stats.offers}
        interviewRate={stats.interviewRate}
      />

      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by company, role, or stage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-DEFAULT/80 border border-white/10 text-xs sm:text-sm text-text-primary placeholder:text-text-disabled focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand backdrop-blur-md"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-text-muted hover:text-text-primary underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Kanban Board or Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[480px] rounded-2xl bg-surface-DEFAULT/40 border border-white/5 animate-pulse p-4 flex flex-col gap-3"
            >
              <div className="h-5 w-24 bg-surface-elevated rounded-md" />
              <div className="h-28 bg-surface-elevated/70 rounded-xl" />
              <div className="h-28 bg-surface-elevated/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          applications={filteredApplications}
          onApplicationsChange={setApplications}
          onOpenAddModal={() => setIsAddModalOpen(true)}
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
