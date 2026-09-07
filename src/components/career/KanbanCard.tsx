"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Building,
  ArrowRight,
  GripVertical,
  ExternalLink,
  Trophy,
  Sparkles,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { ApplicationWithOffer } from "./OfferDetailsPanel";

interface KanbanCardProps {
  application: ApplicationWithOffer;
  onMoveToNextStage?: (id: string, currentStage: string) => void;
  onOpenOfferDetails?: (app: ApplicationWithOffer) => void;
  onDelete?: (id: string) => void;
  isOverlay?: boolean;
}

const STAGE_ORDER = ["applied", "shortlisted", "interviewing", "offered", "rejected"] as const;

export const KanbanCard: React.FC<KanbanCardProps> = ({
  application,
  onMoveToNextStage,
  onOpenOfferDetails,
  onDelete,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
    data: { application },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const app = application as any;
  const isOffered = app.current_stage === "offered";

  // Relative applied date
  let relativeDate = "Recently";
  if (app.applied_date || app.created_at) {
    try {
      const dateStr = app.applied_date || app.created_at;
      const parsed = parseISO(dateStr);
      if (isValid(parsed)) {
        relativeDate = formatDistanceToNow(parsed, { addSuffix: true });
      }
    } catch {
      relativeDate = "Recently";
    }
  }

  // Next stage determination
  const currentIndex = STAGE_ORDER.indexOf(app.current_stage);
  const nextStage =
    currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 2
      ? STAGE_ORDER[currentIndex + 1]
      : null;

  // Source badge
  const source = app.job_board || (app.email_id ? "Email" : "Manual");

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Remove this from Career?")) {
      return;
    }

    // Remove card from local state immediately (optimistic update — don't wait for refetch)
    onDelete?.(app.id);

    try {
      const res = await fetch(`/api/career/applications/${app.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Failed to delete application:", await res.text());
      }
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg bg-surface p-3.5 border transition-all duration-150 ${
        isOffered
          ? "border-[#2FA66A]/40 shadow-xs hover:border-[#2FA66A]"
          : "border-border-default hover:border-border-strong shadow-xs"
      } ${isDragging ? "ring-2 ring-brand/50 shadow-md" : ""}`}
    >
      {/* Top row: Drag Handle & Source Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary p-0.5 rounded -ml-1 transition-colors"
            title="Drag to reorder or move stage"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-surface-secondary text-text-muted border border-border-default">
            {source}
          </span>
        </div>

        {/* Applied relative date & delete action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono text-text-muted flex items-center gap-1">
            <Calendar className="h-3 w-3 text-text-muted" />
            {relativeDate}
          </span>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDelete}
            className="opacity-70 hover:opacity-100 transition-opacity p-0.5 text-text-muted hover:text-[#CF421C] rounded hover:bg-surface-secondary cursor-pointer relative z-10"
            title="Remove this from Career?"
            aria-label="Remove this from Career?"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Company & Role */}
      <div className="space-y-0.5">
        <h4 className="font-semibold text-text-primary text-sm font-ui leading-tight line-clamp-1 group-hover:text-brand transition-colors">
          {app.company_name}
        </h4>
        <p className="text-xs text-text-secondary line-clamp-1">
          {app.role_title || "Position Title"}
        </p>
      </div>

      {/* Offered Special Banner / Quick Access */}
      {isOffered && (
        <div
          onClick={() => onOpenOfferDetails?.(application)}
          className="mt-2.5 cursor-pointer rounded bg-[#2FA66A]/10 p-2 border border-[#2FA66A]/20 hover:border-[#2FA66A]/40 transition-all flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5 text-xs text-[#2FA66A] font-semibold">
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1 font-mono">
              {app.salary_offered
                ? `₹${app.salary_offered} LPA Offer`
                : "Offer Received!"}
            </span>
          </div>
          <span className="text-[10px] text-[#2FA66A] underline font-medium shrink-0">
            Details
          </span>
        </div>
      )}

      {/* Card Footer: Quick Actions */}
      <div className="mt-3 pt-2 border-t border-border-default flex items-center justify-between gap-2">
        {/* If notes or job link exists */}
        <div className="flex items-center gap-2 text-text-muted">
          {app.portfolio_links?.[0] && (
            <a
              href={app.portfolio_links[0]}
              target="_blank"
              rel="noreferrer"
              className="text-text-muted hover:text-brand transition-colors p-1"
              title="Open Job Link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {isOffered && (
            <button
              onClick={() => onOpenOfferDetails?.(application)}
              className="text-[11px] text-[#2FA66A] hover:underline font-medium transition-colors"
            >
              Offer Letter
            </button>
          )}
        </div>

        {/* Move to next stage button */}
        {nextStage && onMoveToNextStage && (
          <button
            onClick={() => onMoveToNextStage(app.id, app.current_stage)}
            className="flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-text-primary px-2 py-0.5 rounded bg-surface-secondary hover:bg-surface-elevated border border-border-default transition-all ml-auto"
            title={`Move to ${nextStage}`}
          >
            <span className="capitalize">{nextStage}</span>
            <ArrowRight className="h-3 w-3 text-brand" />
          </button>
        )}
      </div>
    </div>
  );
};
