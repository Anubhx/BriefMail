"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/ui/Sidebar";
import { BottomNav } from "@/components/ui/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Extract page title from route
  const getPageTitle = () => {
    const segment = pathname.split("/").filter(Boolean).pop();
    if (!segment || segment === "inbox") return "Inbox";
    if (segment === "all-mail") return "All Mail";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="flex h-screen bg-surface-canvas text-text-primary overflow-hidden font-ui">
      {/* Desktop Left Sidebar (230px fixed) — hidden on mobile (<1024px) */}
      <div className="hidden lg:block shrink-0 border-r border-border bg-surface">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface-canvas">
        {/* Quiet Editorial Header */}
        <header className="h-13 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono uppercase tracking-widest text-text-muted">BriefMail</span>
            <span className="text-border-strong text-xs font-mono">/</span>
            <h1 className="text-sm font-medium text-text-primary tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="hidden sm:inline">Synced</span>
            </div>
            <div className="lg:hidden flex items-center">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Main Page View Content — pb-20 on mobile (<1024px) to clear BottomNav */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 pb-20 lg:pb-4 bg-surface-canvas">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<1024px) */}
      <BottomNav />
    </div>
  );
}
