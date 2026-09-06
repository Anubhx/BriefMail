"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, DollarSign, Briefcase, Calendar, Settings, Mail } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
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
    </aside>
  );
}
