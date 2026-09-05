import React from "react";
import { MeetingCard } from "@/components/meetings/MeetingCard";

export default function MeetingsPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ui text-xl font-bold text-text-primary">Meetings & Calendar</h1>
          <p className="text-sm text-text-muted">Smart calendar invitations and meeting digests.</p>
        </div>
      </div>
      <MeetingCard />
    </div>
  );
}
