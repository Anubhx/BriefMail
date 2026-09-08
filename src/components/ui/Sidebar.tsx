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
  Settings,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";

import { Logo } from "@/components/ui/Logo";

const mainNavItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox, badge: 5 },
  { href: "/all-mail", label: "All Mail", icon: Mail },
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/snoozed", label: "Snoozed", icon: Clock },
];

// TODO: wire category counts from inbox data
const categoryNavItems = [
  { href: "/finance", label: "Finance", color: "#2FA66A" },
  { href: "/career", label: "Career", color: "#4267D5" },
  { href: "/meetings", label: "Meetings", color: "#8B5CC7" },
  { href: "/investments", label: "Investments", color: "#0D9488" },
  { href: "/inbox?category=social", label: "Social", color: "#0EA5E9" },
  { href: "/inbox?category=newsletter", label: "Newsletter", color: "#8B5CF6" },
  { href: "/system", label: "OTP & Codes", color: "#E46C2E" },
];

const connectedAccounts = [
  { email: "anubhav@gmail.com", active: true },
  { email: "work@briefmail.ai", active: false },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category");
  const sidebarRef = useRef<HTMLDivElement>(null);

  return (
    <aside
      ref={sidebarRef}
      aria-label="Sidebar navigation"
      className="w-[230px] h-screen bg-surface border-r border-border flex flex-col justify-between p-3.5 shrink-0 overflow-y-auto select-none font-ui"
    >
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <Link href="/inbox" className="flex items-center px-1.5 py-1 group">
          <Logo
            variant="long"
            width={145}
            height={27}
            priority
            className="group-hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Section 1: Main Navigation */}
        <div className="flex flex-col gap-0.5">
          <span className="px-2 text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted mb-1">
            Mail
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
                  "relative flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors duration-150 group",
                  isActive
                    ? "bg-surface-secondary text-text-primary font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70"
                )}
              >
                {/* Quiet 2px orange left indicator for active row */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-brand rounded-r" />
                )}

                <div className="flex items-center gap-2 pl-0.5">
                  <Icon
                    className={clsx(
                      "w-4 h-4 stroke-[1.75]",
                      isActive ? "text-brand" : "text-text-muted group-hover:text-text-secondary"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span
                    className={clsx(
                      "px-1.5 py-0.2 rounded font-mono text-[10px] leading-none",
                      isActive
                        ? "bg-brand/10 text-brand font-semibold"
                        : "bg-surface-subtle text-text-muted"
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Section 2: Categories */}
        <div className="flex flex-col gap-0.5">
          <span className="px-2 text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted mb-1">
            Categories
          </span>
          {categoryNavItems.map((item) => {
            const [itemPath, itemQuery] = item.href.split("?");
            const itemCat = itemQuery ? new URLSearchParams(itemQuery).get("category") : null;
            const isActive = itemCat
              ? pathname === itemPath && currentCategory === itemCat
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors duration-150 group",
                  isActive
                    ? "bg-surface-secondary text-text-primary font-medium"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-brand rounded-r" />
                )}

                <div className="flex items-center gap-2 pl-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Section 3: Accounts */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted">
              Accounts
            </span>
            <Link
              href="/settings"
              title="Add Account"
              className="text-text-muted hover:text-text-primary transition-colors p-0.5"
            >
              <Plus className="w-3 h-3" />
            </Link>
          </div>
          {connectedAccounts.map((account) => (
            <div
              key={account.email}
              className="flex items-center justify-between px-2.5 py-1 rounded-md text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <span className="truncate text-[11px] font-mono">{account.email}</span>
              {account.active && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Footer / User & Settings */}
      <div className="border-t border-border pt-3 flex items-center justify-between px-1">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-text-muted" />
          <span>Settings</span>
        </Link>
        <div className="scale-85 origin-right">
          <UserButton />
        </div>
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-[230px] h-screen bg-surface border-r border-border" />}>
      <SidebarContent />
    </Suspense>
  );
}
