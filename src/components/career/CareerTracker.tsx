"use client";

import React from "react";
import { ActionCard } from "@/components/ui/ActionCard";

export const CareerTracker: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-ui text-xs font-semibold uppercase tracking-wider text-text-muted">
        Career Opportunities & Applications
      </h3>
      <ActionCard
        title="TechCorp - Senior Full Stack Engineer"
        badge="Interview"
        timestamp="2h ago"
        snippet="Recruiter requested availability for a 45-min technical deep-dive."
        isUrgent={true}
      />
      <ActionCard
        title="DesignCraft - Staff Engineer"
        badge="Applied"
        timestamp="3d ago"
        snippet="Application submitted successfully. Under review by engineering team."
      />
    </div>
  );
};
