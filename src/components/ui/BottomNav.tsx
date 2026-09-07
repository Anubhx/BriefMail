"use client";

import React, { useRef, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Inbox,
  DollarSign,
  Briefcase,
  Calendar,
  MoreHorizontal,
  Mail,
  Shield,
  Star,
  Clock,
  Settings,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@/hooks/useGSAP";
import { Logo } from "@/components/ui/Logo";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const PRIMARY_NAV_ITEMS: BottomNavItem[] = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/meetings", label: "Meetings", icon: Calendar },
];

const MORE_NAV_ITEMS = [
  { href: "/all-mail", label: "All Mail", icon: Mail, desc: "Search & view entire message archive" },
  { href: "/starred", label: "Starred", icon: Star, desc: "Important flagged messages" },
  { href: "/snoozed", label: "Snoozed", icon: Clock, desc: "Messages set aside for later" },
  { href: "/system", label: "System & OTP", icon: Shield, desc: "Verification codes & system alerts" },
  { href: "/inbox?category=social", label: "Social", icon: Users, desc: "Invitations and network updates" },
  { href: "/inbox?category=newsletter", label: "Newsletter", icon: Mail, desc: "Subscribed digests and reads" },
  { href: "/settings", label: "Settings", icon: Settings, desc: "Account preferences & sync settings" },
];

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category");
  const navRef = useRef<HTMLElement>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // GSAP subtle entrance on initial mount
  useGSAP(
    () => {
      gsap.from(navRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
      });
    },
    { scope: navRef }
  );

  const handleTap = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        // Safe fallback
      }
    }
  };

  const isMoreActive =
    isMoreOpen ||
    pathname === "/all-mail" ||
    pathname === "/starred" ||
    pathname === "/snoozed" ||
    pathname === "/system" ||
    pathname === "/settings" ||
    currentCategory === "social" ||
    currentCategory === "newsletter";

  return (
    <>
      {/* Slide-up "More" Sheet */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/30 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="relative z-10 w-full bg-surface border-t border-border rounded-t-xl p-5 shadow-elevation-3 space-y-4 max-h-[80vh] overflow-y-auto"
              style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Logo variant="square" width={24} height={22} />
                  <div>
                    <h3 className="text-sm font-ui font-semibold text-text-primary">More Destinations</h3>
                    <p className="text-xs text-text-muted">Secondary mailboxes and system views</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {MORE_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const [itemPath, itemQuery] = item.href.split("?");
                  const itemCat = itemQuery ? new URLSearchParams(itemQuery).get("category") : null;
                  const isItemActive = itemCat
                    ? pathname === itemPath && currentCategory === itemCat
                    : pathname.startsWith(itemPath);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        handleTap();
                        setIsMoreOpen(false);
                      }}
                      className={clsx(
                        "flex items-center gap-3.5 p-3 rounded-lg transition-colors",
                        isItemActive
                          ? "bg-surface-secondary text-brand font-medium"
                          : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-9 h-9 rounded-md flex items-center justify-center shrink-0 border",
                          isItemActive
                            ? "border-brand/30 bg-brand/10 text-brand"
                            : "border-border bg-surface-subtle text-text-muted"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-ui leading-tight">{item.label}</div>
                        <div className="text-xs text-text-muted truncate mt-0.5">{item.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary 5-item Mobile Bottom Navigation Bar */}
      <nav
        ref={navRef}
        aria-label="Mobile primary navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface select-none shadow-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5 h-[58px] items-center">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isExactInbox = item.href === "/inbox" && pathname === "/inbox" && !currentCategory;
            const isActive =
              isExactInbox ||
              (!currentCategory && item.href !== "/inbox" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleTap}
                className={clsx(
                  "relative flex flex-col items-center justify-center h-full min-h-[48px] gap-1 transition-colors outline-none",
                  isActive
                    ? "text-brand font-semibold"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActiveBar"
                    className="absolute top-0 left-4 right-4 h-[2px] bg-brand"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-ui tracking-tight leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 5th Item: More */}
          <button
            onClick={() => {
              handleTap();
              setIsMoreOpen((prev) => !prev);
            }}
            className={clsx(
              "relative flex flex-col items-center justify-center h-full min-h-[48px] gap-1 transition-colors outline-none",
              isMoreActive
                ? "text-brand font-semibold"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            {isMoreActive && (
              <motion.div
                layoutId="bottomNavActiveBar"
                className="absolute top-0 left-4 right-4 h-[2px] bg-brand"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-ui tracking-tight leading-none">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[58px] bg-surface border-t border-border" />}>
      <BottomNavContent />
    </Suspense>
  );
}

