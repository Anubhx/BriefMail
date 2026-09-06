"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn, ColumnConfig } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { OfferDetailsPanel, ApplicationWithOffer, OfferDetails } from "./OfferDetailsPanel";
import { Briefcase, Sparkles, Plus } from "lucide-react";

const COLUMNS: ColumnConfig[] = [
  {
    id: "applied",
    title: "Applied",
    color: "bg-sky-400",
    badgeBg: "bg-sky-500/10",
    badgeText: "text-sky-400",
    borderColor: "border-sky-500/20",
  },
  {
    id: "shortlisted",
    title: "Shortlisted",
    color: "bg-purple-400",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-400",
    borderColor: "border-purple-500/20",
  },
  {
    id: "interviewing",
    title: "Interviewing",
    color: "bg-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/20",
  },
  {
    id: "offered",
    title: "Offered",
    color: "bg-emerald-400",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "bg-rose-400",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-400",
    borderColor: "border-rose-500/20",
  },
];

const STAGE_ORDER = ["applied", "shortlisted", "interviewing", "offered", "rejected"] as const;

interface KanbanBoardProps {
  applications: ApplicationWithOffer[];
  onApplicationsChange: (apps: ApplicationWithOffer[]) => void;
  onOpenAddModal: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onApplicationsChange,
  onOpenAddModal,
}) => {
  const [activeCard, setActiveCard] = useState<ApplicationWithOffer | null>(null);
  const [selectedOfferApp, setSelectedOfferApp] = useState<ApplicationWithOffer | null>(null);
  const [isOfferPanelOpen, setIsOfferPanelOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px drag before initiating to avoid interfering with clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = applications.find((a) => a.id === active.id);
    if (found) {
      setActiveCard(found);
    }
  };

  const updateStageOnServer = async (id: string, newStage: string) => {
    try {
      await fetch(`/api/career/applications/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (err) {
      console.error("Failed to update stage on server:", err);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine target stage:
    // If dropped over a column directly, overId matches column ID.
    // If dropped over another card, look up that card's current stage.
    let targetStage: string | null = null;
    const isOverColumn = COLUMNS.some((c) => c.id === overId);

    if (isOverColumn) {
      targetStage = overId;
    } else {
      const overCard = applications.find((a) => a.id === overId);
      if (overCard) {
        targetStage = overCard.current_stage;
      }
    }

    if (!targetStage) return;

    const currentApp = applications.find((a) => a.id === activeId);
    if (!currentApp || currentApp.current_stage === targetStage) return;

    // Optimistic UI update
    const updated = applications.map((app) =>
      app.id === activeId ? { ...app, current_stage: targetStage! } : app
    );
    onApplicationsChange(updated);

    // If moved to "offered", open offer details panel for convenience
    if (targetStage === "offered") {
      const targetApp = updated.find((a) => a.id === activeId);
      if (targetApp) {
        setSelectedOfferApp(targetApp);
        setIsOfferPanelOpen(true);
      }
    }

    // Persist to backend
    updateStageOnServer(activeId, targetStage);
  };

  // Quick action: advance to next stage in sequence
  const handleMoveToNextStage = (id: string, currentStage: string) => {
    const currentIndex = STAGE_ORDER.indexOf(currentStage as any);
    if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIndex + 1];

      // Optimistic update
      const updated = applications.map((app) =>
        app.id === id ? { ...app, current_stage: nextStage } : app
      );
      onApplicationsChange(updated);

      if (nextStage === "offered") {
        const targetApp = updated.find((a) => a.id === id);
        if (targetApp) {
          setSelectedOfferApp(targetApp);
          setIsOfferPanelOpen(true);
        }
      }

      updateStageOnServer(id, nextStage);
    }
  };

  const handleOpenOfferDetails = (app: ApplicationWithOffer) => {
    setSelectedOfferApp(app);
    setIsOfferPanelOpen(true);
  };

  const handleOfferSaved = (savedOffer: OfferDetails) => {
    if (!selectedOfferApp) return;

    const updated = applications.map((app) => {
      if (app.id === selectedOfferApp.id) {
        return {
          ...app,
          salary_offered: savedOffer.ctc_lpa ?? app.salary_offered,
          offer_letters: savedOffer,
        };
      }
      return app;
    });

    onApplicationsChange(updated);
  };

  // If no applications at all, show empty state
  if (applications.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-surface-DEFAULT/70 backdrop-blur-md p-10 sm:p-16 flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-brand-subtle text-brand border border-brand/20 mb-5 shadow-brand-glow">
          <Briefcase className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-text-primary font-ui">
          No applications yet
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-text-muted max-w-md">
          Emails with job applications, interview invites, and offers will appear here
          automatically once classified by your AI pipeline.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-brand-glow"
        >
          <Plus className="h-4 w-4" />
          Add Manual Application
        </button>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex items-start gap-4 min-w-[1300px]">
            {COLUMNS.map((column) => {
              const columnApps = applications.filter(
                (app) => app.current_stage === column.id
              );
              return (
                <KanbanColumn
                  key={column.id}
                  config={column}
                  applications={columnApps}
                  onMoveToNextStage={handleMoveToNextStage}
                  onOpenOfferDetails={handleOpenOfferDetails}
                />
              );
            })}
          </div>
        </div>

        {/* Smooth Drag Overlay */}
        <DragOverlay>
          {activeCard ? (
            <div className="w-[300px] pointer-events-none rotate-2 scale-105 shadow-2xl">
              <KanbanCard application={activeCard} isOverlay={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Offer Details Drawer */}
      <OfferDetailsPanel
        application={selectedOfferApp}
        isOpen={isOfferPanelOpen}
        onClose={() => {
          setIsOfferPanelOpen(false);
          setSelectedOfferApp(null);
        }}
        onSaveSuccess={handleOfferSaved}
      />
    </>
  );
};
