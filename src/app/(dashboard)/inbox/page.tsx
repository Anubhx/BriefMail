"use client";

import React from "react";
import { EmailListEntrance } from "@/components/email/EmailListEntrance";
import { EmailRow } from "@/components/email/EmailRow";
import { useEmailStore } from "@/store/useEmailStore";

export default function InboxPage() {
  const { emails, selectedEmailId, setSelectedEmailId } = useEmailStore();

  return (
    <div className="flex gap-6 max-w-6xl mx-auto h-full">
      {/* Email List Column */}
      <div className="w-96 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-ui text-xl font-bold text-text-primary">Inbox</h1>
          <span className="text-xs font-mono text-text-muted">{emails.length} messages</span>
        </div>
        <EmailListEntrance>
          {emails.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              isSelected={selectedEmailId === email.id}
              onSelect={() => setSelectedEmailId(email.id)}
            />
          ))}
        </EmailListEntrance>
      </div>

      {/* Email Reader View */}
      <div className="flex-1 bg-surface rounded-xl border border-border-subtle p-6 flex flex-col justify-between">
        {selectedEmailId ? (
          <div>
            <div className="border-b border-border-subtle pb-4 mb-4">
              <h2 className="font-ui text-lg font-bold text-text-primary mb-1">
                {emails.find((e) => e.id === selectedEmailId)?.subject}
              </h2>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>From: {emails.find((e) => e.id === selectedEmailId)?.sender}</span>
                <span>{emails.find((e) => e.id === selectedEmailId)?.date}</span>
              </div>
            </div>
            <p className="font-body text-sm text-text-secondary leading-relaxed">
              {emails.find((e) => e.id === selectedEmailId)?.snippet}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-sm font-ui">
            Select an email to view details
          </div>
        )}
      </div>
    </div>
  );
}
