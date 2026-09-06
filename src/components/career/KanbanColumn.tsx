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
      className={`flex flex-col rounded-2xl bg-surface-base/60 backdrop-blur-md border transition-all duration-200 min-w-[280px] sm:min-w-[300px] flex-1 ${
        isOver
          ? "border-brand/50 ring-2 ring-brand/20 bg-surface-elevated/40"
          : "border-white/5"
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
          <h3 className="font-ui font-semibold text-sm text-text-primary tracking-wide">
            {config.title}
          </h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText} border border-white/5`}
        >
          {applications.length}
        </span>
      </div>

      {/* Cards List / Droppable Area */}
      <div className="p-3 flex-1 flex flex-col gap-3 min-h-[420px]">
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
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl p-6 text-center text-text-disabled">
            <span className="text-xs">Drop cards here</span>
          </div>
        )}
      </div>
    </div>
  );
};
