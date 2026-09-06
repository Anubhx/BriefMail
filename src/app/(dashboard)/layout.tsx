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
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden font-ui">
      {/* Desktop Left Sidebar (240px fixed) — hidden on mobile (<1024px) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border-subtle bg-surface/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 select-none">
          <div className="flex items-center gap-3">
            <h1 className="font-ui text-sm font-semibold text-text-primary tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-brand-subtle text-brand border border-brand/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              AI Sync Active
            </span>
            <div className="lg:hidden">
              <UserButton />
            </div>
          </div>
        </header>

        {/* Main Page View Content — pb-20 on mobile (<1024px) to clear BottomNav */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6 bg-surface-base">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<1024px) */}
      <BottomNav />
    </div>
  );
}
