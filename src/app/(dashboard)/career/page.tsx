import React from "react";
import { CareerTracker } from "@/components/career/CareerTracker";

export default function CareerPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ui text-xl font-bold text-text-primary">Career Copilot</h1>
          <p className="text-sm text-text-muted">Track application statuses, recruiter threads, and interviews.</p>
        </div>
      </div>
      <CareerTracker />
    </div>
  );
}
