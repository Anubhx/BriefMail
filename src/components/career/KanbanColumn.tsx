"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { ApplicationWithOffer } from "./OfferDetailsPanel";

export interface ColumnConfig {
  id: string;
  title: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

interface KanbanColumnProps {
  config: ColumnConfig;
  applications: ApplicationWithOffer[];
  onMoveToNextStage: (id: string, currentStage: string) => void;
  onOpenOfferDetails: (app: ApplicationWithOffer) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  config,
  applications,
  onMoveToNextStage,
  onOpenOfferDetails,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
    data: { stage: config.id },
  });

  const cardIds = applications.map((a) => a.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg bg-surface-secondary/60 border transition-all duration-150 min-w-[280px] sm:min-w-[300px] flex-1 ${
        isOver
          ? "border-brand/40 ring-1 ring-brand/20 bg-surface-secondary"
          : "border-border-default"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border-default flex items-center justify-between bg-surface/40">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${config.color}`} />
          <h3 className="font-ui font-semibold text-xs uppercase tracking-wider text-text-primary">
            {config.title}
          </h3>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface text-text-secondary border border-border-default"
        >
          {applications.length}
        </span>
      </div>

      {/* Cards List / Droppable Area */}
      <div className="p-2.5 flex-1 flex flex-col gap-2.5 min-h-[420px]">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <KanbanCard
              key={app.id}
              application={app}
              onMoveToNextStage={onMoveToNextStage}
              onOpenOfferDetails={onOpenOfferDetails}
            />
          ))}
        </SortableContext>

        {applications.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border-default rounded-lg p-6 text-center text-text-muted">
            <span className="text-xs">Drop cards here</span>
          </div>
        )}
      </div>
    </div>
  );
};
