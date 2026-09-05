"use client";

import React from "react";
import { ActionCard } from "@/components/ui/ActionCard";

export const MeetingCard: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-ui text-xs font-semibold uppercase tracking-wider text-text-muted">
        Upcoming Calendar & Syncs
      </h3>
      <ActionCard
        title="Architecture Sync w/ Anubhav"
        badge="Google Meet"
        timestamp="Today @ 2:00 PM"
        snippet="Discussing Next.js 15 App Router migration and AI model routing architecture."
        isUrgent={true}
      />
    </div>
  );
};
