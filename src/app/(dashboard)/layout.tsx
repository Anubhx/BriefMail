"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border-subtle bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <h2 className="font-ui text-sm font-semibold text-text-primary capitalize">
            {pathname.split("/")[2] || pathname.split("/")[1] || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-brand-subtle text-brand border border-brand/20">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              AI Sync Active
            </span>
            <UserButton />
          </div>
        </header>

        {/* Page Content — add pb-20 on mobile to clear BottomNav */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6 bg-surface-base">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
