"use client";

import React, { useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Inbox,
  Mail,
  Star,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  CheckCircle2,
  Shield,
  Users,
} from "lucide-react";

import { clsx } from "clsx";
import gsap from "gsap";
import { useGSAP } from "@/hooks/useGSAP";

const mainNavItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox, badge: 5 },
  { href: "/all-mail", label: "All Mail", icon: Mail },
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/snoozed", label: "Snoozed", icon: Clock },
];

const categoryNavItems = [
  { href: "/finance", label: "Finance", icon: DollarSign, color: "bg-emerald-500" },
  { href: "/career", label: "Career", icon: Briefcase, color: "bg-blue-500" },
  { href: "/meetings", label: "Meetings", icon: Calendar, color: "bg-purple-500" },
  { href: "/investments", label: "Investments", icon: TrendingUp, color: "bg-cyan-500" },
  { href: "/inbox?category=social", label: "Social", icon: Users, color: "bg-pink-500" },
  { href: "/inbox?category=newsletter", label: "Newsletter", icon: Mail, color: "bg-teal-500" },
  { href: "/system", label: "OTP", icon: Shield, color: "bg-amber-500" },
];

const connectedAccounts = [
  { email: "anubhav@gmail.com", active: true, color: "bg-emerald-400" },
  { email: "work@briefmail.ai", active: false, color: "bg-blue-400" },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeUnderlineRef = useRef<HTMLDivElement>(null);

  // GSAP subtle load animation for sidebar items
  useGSAP(
    () => {
      gsap.from(".sidebar-item", {
        x: -12,
        opacity: 0,
        stagger: 0.02,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    { scope: sidebarRef }
  );

  return (
    <aside
      ref={sidebarRef}
      aria-label="Sidebar navigation"
      className="w-[240px] h-screen border-r border-border-subtle bg-surface flex flex-col justify-between p-4 shrink-0 overflow-y-auto select-none font-ui"
    >
      <div className="flex flex-col gap-6">
        {/* Logo & Brand Header */}
        <Link href="/inbox" className="flex items-center gap-3 px-2 py-1 group">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-brand-glow transition-transform duration-200 group-hover:scale-105">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-ui text-base font-bold tracking-tight text-text-primary flex items-center gap-1">
              Brief<span className="text-brand">Mail</span>
            </span>
            <span className="text-[10px] font-mono text-text-muted">Pro Edition</span>
          </div>
        </Link>

        {/* Section 1: Main Navigation */}
        <div className="flex flex-col gap-1">
          <span className="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted mb-1">
            Main
          </span>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isExactInbox = item.href === "/inbox" && pathname === "/inbox" && !currentCategory;
            const isActive = isExactInbox || (item.href !== "/inbox" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "sidebar-item relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group",
                  isActive
                    ? "bg-brand-subtle text-brand font-semibold border border-brand/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={clsx("w-4 h-4 transition-transform duration-150 group-hover:scale-110", isActive ? "text-brand" : "text-text-muted")} />
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-brand text-white font-bold leading-none">
                    {item.badge}
                  </span>
                ) : null}

                {/* Animated active indicator bar (GSAP feel) */}
                {isActive && (
                  <div
                    ref={activeUnderlineRef}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-brand rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Section 2: Smart Categories */}
        <div className="flex flex-col gap-1">
          <span className="px-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted mb-1">
            Categories
          </span>
          {categoryNavItems.map((item) => {
            const Icon = item.icon;
            const [itemPath, itemQuery] = item.href.split("?");
            const itemCat = itemQuery ? new URLSearchParams(itemQuery).get("category") : null;
            const isActive = itemCat
              ? pathname === itemPath && currentCategory === itemCat
              : !currentCategory && pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "sidebar-item relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group",
                  isActive
                    ? "bg-brand-subtle text-brand font-semibold border border-brand/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={clsx("w-2 h-2 rounded-full", item.color)} />
                  <Icon className="w-3.5 h-3.5 text-text-muted group-hover:text-text-secondary transition-colors" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Section 3: Connected Accounts */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
              Accounts
            </span>
            <button
              title="Connect Account"
              className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {connectedAccounts.map((account) => (
            <div
              key={account.email}
              className="sidebar-item flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:bg-surface-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", account.color)} />
                <span className="truncate text-[11px] font-mono">{account.email}</span>
              </div>
              {account.active && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / User & Settings */}
      <div className="border-t border-border-subtle pt-3 flex items-center justify-between px-2">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings className="w-4 h-4 text-text-muted" />
          <span>Settings</span>
        </Link>
        <div className="scale-90">
          <UserButton />
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-[240px] h-screen border-r border-border-subtle bg-surface" />}>
      <SidebarContent />
    </Suspense>
  );
}
