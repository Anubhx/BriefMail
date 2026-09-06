"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, DollarSign, Briefcase, Calendar, Settings } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface/90 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-ui transition-colors min-w-[52px]",
                isActive
                  ? "text-brand font-semibold"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
