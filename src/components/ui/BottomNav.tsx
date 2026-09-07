"use client";

import React, { useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Inbox,
  DollarSign,
  Briefcase,
  Calendar,
  MoreHorizontal,
  Users,
  Mail,
  Shield,
} from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@/hooks/useGSAP";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: BottomNavItem[] = [
  { href: "/inbox", label: "Inbox", icon: Inbox, badge: 5 },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/inbox?category=social", label: "Social", icon: Users },
  { href: "/inbox?category=newsletter", label: "Newsletter", icon: Mail },
  { href: "/system", label: "OTP", icon: Shield },
  { href: "/settings", label: "More", icon: MoreHorizontal },
];

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category");
  const navRef = useRef<HTMLElement>(null);

  // GSAP initial mount entrance animation
  useGSAP(
    () => {
      gsap.from(navRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      });
    },
    { scope: navRef }
  );

  const handleTap = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(100);
      } catch {
        // Ignore if restricted by browser policy
      }
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[60px] border-t border-border-subtle bg-surface/95 backdrop-blur-xl shadow-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between sm:justify-around h-full px-2 overflow-x-auto no-scrollbar gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const [itemPath, itemQuery] = item.href.split("?");
          const itemCat = itemQuery ? new URLSearchParams(itemQuery).get("category") : null;
          const isExactInbox = item.href === "/inbox" && pathname === "/inbox" && !currentCategory;
          const isActive = itemCat
            ? pathname === itemPath && currentCategory === itemCat
            : isExactInbox || (!currentCategory && item.href !== "/inbox" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleTap}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-xl transition-all duration-200 min-w-[52px] shrink-0 select-none",
                isActive
                  ? "text-brand font-semibold"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative flex items-center justify-center"
              >
                <Icon
                  className={clsx(
                    "w-4 h-4 transition-all duration-200",
                    isActive ? "stroke-[2.5]" : "stroke-[1.75]"
                  )}
                />

                {/* Badge for unread count */}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-brand text-white font-mono text-[8px] font-bold leading-none shadow-sm">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </motion.div>

              <span className="text-[10px] font-ui tracking-tight leading-tight whitespace-nowrap">
                {item.label}
              </span>

              {/* Active Indicator Glow */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-surface/95 border-t border-border-subtle" />}>
      <BottomNavContent />
    </Suspense>
  );
}
