"use client";

import React, { useState } from "react";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import { EmailListItem } from "@/components/email/EmailListItem";
import { EmailDetail } from "@/components/email/EmailDetail";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { EmailListEntrance } from "@/components/email/EmailListEntrance";
import { useEmailStore } from "@/store/useEmailStore";
import { EmailItem } from "@/types";

export default function InboxPage() {
  const { emails, selectedEmailId, setSelectedEmailId } = useEmailStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeEmailModal, setActiveEmailModal] = useState<EmailItem | null>(null);

  // Filter emails based on category tab
  const filteredEmails = emails.filter((e) => {
    if (activeCategory === "all") return true;
    return e.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleRefresh = async () => {
    // Simulate refetching data from server / sync engine
    await new Promise((resolve) => setTimeout(resolve, 800));
  };

  const handleArchive = (id: string) => {
    if (activeEmailModal?.id === id) setActiveEmailModal(null);
  };

  const handleSnooze = (id: string) => {
    if (activeEmailModal?.id === id) setActiveEmailModal(null);
  };

  const handleStar = (id: string) => {
    // Toggle star
  };

  // Selected email for desktop reading panel
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-4 max-w-7xl mx-auto h-full font-ui">
        {/* Category Tabs Bar */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          categoryCounts={{
            all: emails.length,
            finance: emails.filter((e) => e.category.toLowerCase() === "finance").length,
            jobs: emails.filter((e) => e.category.toLowerCase() === "jobs" || e.category.toLowerCase() === "career").length,
            career: emails.filter((e) => e.category.toLowerCase() === "career").length,
            investments: emails.filter((e) => e.category.toLowerCase() === "investments").length,
            meetings: emails.filter((e) => e.category.toLowerCase() === "meetings").length,
            system: emails.filter((e) => e.category.toLowerCase() === "system").length,
          }}
        />

        {/* Email Content Container (Split pane on desktop) */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Email List Column */}
          <div className="flex-1 lg:w-96 lg:flex-initial flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between px-1 mb-1">
              <h2 className="font-ui text-xs font-semibold text-text-muted uppercase tracking-wider">
                {activeCategory === "all" ? "All Messages" : activeCategory}
              </h2>
              <span className="text-xs font-mono text-text-muted">
                {filteredEmails.length} items
              </span>
            </div>

            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm font-ui bg-surface/30">
                No emails found in this category
              </div>
            ) : (
              <EmailListEntrance>
                {filteredEmails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    id={email.id}
                    subject={email.subject}
                    sender={email.sender}
                    snippet={email.snippet}
                    date={email.date}
                    category={email.category}
                    isUnread={email.isUnread}
                    hasActionItem={email.isUrgent}
                    isSelected={selectedEmailId === email.id}
                    onClick={() => {
                      setSelectedEmailId(email.id);
                      setActiveEmailModal(email);
                    }}
                    onArchive={() => handleArchive(email.id)}
                    onSnooze={() => handleSnooze(email.id)}
                    onStar={() => handleStar(email.id)}
                  />
                ))}
              </EmailListEntrance>
            )}
          </div>

          {/* Desktop Detail Reading Pane (Hidden on mobile) */}
          <div className="hidden lg:flex flex-1 bg-surface rounded-xl border border-border-subtle p-6 flex-col justify-between overflow-y-auto shadow-sm">
            {selectedEmail ? (
              <div className="flex flex-col gap-4">
                <div className="border-b border-border-subtle pb-4">
                  <h2 className="font-ui text-xl font-bold text-text-primary mb-2">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="font-medium text-text-secondary">
                      From: <strong className="text-text-primary">{selectedEmail.sender}</strong> ({selectedEmail.email})
                    </span>
                    <span className="font-mono">{selectedEmail.date}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-brand-subtle/40 border border-brand/20 text-xs italic text-brand flex items-start gap-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px] not-italic bg-brand text-white px-1.5 py-0.5 rounded">
                    AI Summary
                  </span>
                  <span>{selectedEmail.snippet}</span>
                </div>

                <div className="font-body text-sm text-text-secondary leading-relaxed whitespace-pre-wrap pt-2">
                  {selectedEmail.snippet}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm font-ui gap-2">
                <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
                  ✉️
                </div>
                <span>Select an email to view details</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Detail Modal Sheet (<1024px) */}
        {activeEmailModal && (
          <div className="lg:hidden">
            <EmailDetail
              email={activeEmailModal}
              onClose={() => setActiveEmailModal(null)}
              onArchive={handleArchive}
              onSnooze={handleSnooze}
              onStar={handleStar}
            />
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
