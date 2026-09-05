"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Inbox, DollarSign, Briefcase, Calendar, Settings, Mail } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border-subtle bg-surface flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-text-primary font-bold shadow-brand-glow">
              <Mail className="w-4 h-4" />
            </div>
            <span className="font-ui text-lg font-bold tracking-tight text-text-primary">
              Brief<span className="text-brand">Mail</span>
            </span>
          </Link>

          {/* Navigation items */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-ui transition-colors",
                    isActive
                      ? "bg-brand-subtle text-brand-hover border border-brand/20 font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Clerk Controls */}
        <div className="pt-4 border-t border-border-subtle flex items-center justify-between px-3">
          <span className="text-xs font-ui text-text-muted">Logged in</span>
          <UserButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border-subtle bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <h2 className="font-ui text-sm font-semibold text-text-primary capitalize">
            {pathname.split("/")[1] || "Dashboard"}
          </h2>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-brand-subtle text-brand border border-brand/20">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
              AI Sync Active
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface-base">
          {children}
        </main>
      </div>
    </div>
  );
}
