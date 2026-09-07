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
    color: "bg-[#4267D5]",
    badgeBg: "bg-[#4267D5]/10",
    badgeText: "text-[#4267D5]",
    borderColor: "border-[#4267D5]/20",
  },
  {
    id: "shortlisted",
    title: "Shortlisted",
    color: "bg-[#8B5CC7]",
    badgeBg: "bg-[#8B5CC7]/10",
    badgeText: "text-[#8B5CC7]",
    borderColor: "border-[#8B5CC7]/20",
  },
  {
    id: "interviewing",
    title: "Interviewing",
    color: "bg-[#D58A00]",
    badgeBg: "bg-[#D58A00]/10",
    badgeText: "text-[#D58A00]",
    borderColor: "border-[#D58A00]/20",
  },
  {
    id: "offered",
    title: "Offered",
    color: "bg-[#2FA66A]",
    badgeBg: "bg-[#2FA66A]/10",
    badgeText: "text-[#2FA66A]",
    borderColor: "border-[#2FA66A]/20",
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "bg-[#777A80]",
    badgeBg: "bg-[#777A80]/10",
    badgeText: "text-[#777A80]",
    borderColor: "border-[#777A80]/20",
  },
];

const STAGE_ORDER = ["applied", "shortlisted", "interviewing", "offered", "rejected"] as const;

interface KanbanBoardProps {
  applications: ApplicationWithOffer[];
  onApplicationsChange: (apps: ApplicationWithOffer[]) => void;
  onOpenAddModal: () => void;
  onDeleteApplication?: (id: string) => void;
  onClearJobAlerts?: () => void;
  jobAlertsCount?: number;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onApplicationsChange,
  onOpenAddModal,
  onDeleteApplication,
  onClearJobAlerts,
  jobAlertsCount,
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

  if (applications.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-border-default bg-surface-secondary p-10 sm:p-14 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-surface border border-border-default text-text-muted mb-3 shadow-xs">
          <Briefcase className="h-6 w-6 text-text-muted" />
        </div>
        <h3 className="text-base font-semibold text-text-primary font-ui">
          No applications recorded yet
        </h3>
        <p className="mt-1 text-xs text-text-muted max-w-md">
          Emails with job applications, interview invites, and offers will appear here
          automatically once classified by your pipeline.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
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
                  onDeleteApplication={onDeleteApplication}
                  onClearJobAlerts={column.id === "applied" ? onClearJobAlerts : undefined}
                  jobAlertsCount={column.id === "applied" ? jobAlertsCount : undefined}
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
