"use client";

import React, { useEffect, useRef } from "react";
import { Briefcase, CheckCircle2, Trophy, TrendingUp } from "lucide-react";
import gsap from "gsap";

interface StatsProps {
  total: number;
  active: number;
  offers: number;
  interviewRate: number;
}

export const CareerStatsBar: React.FC<StatsProps> = ({
  total,
  active,
  offers,
  interviewRate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }
  }, []);

  const stats = [
    {
      label: "Total Applications",
      value: total,
      sublabel: "All recorded jobs",
      icon: Briefcase,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      label: "Active Pipeline",
      value: active,
      sublabel: "In progress / reviewing",
      icon: CheckCircle2,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Offers Received",
      value: offers,
      sublabel: "Ready for decision",
      icon: Trophy,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
      glow: offers > 0 ? "shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]" : "",
    },
    {
      label: "Interview Rate",
      value: `${interviewRate}%`,
      sublabel: "Screened to interview",
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full"
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl bg-surface-DEFAULT/80 backdrop-blur-md p-4 sm:p-5 border ${stat.border} transition-all duration-300 hover:border-white/20 hover:bg-surface-elevated/80 ${stat.glow || ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-medium text-text-muted">
                {stat.label}
              </span>
              <div
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary font-ui">
                {stat.value}
              </span>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-text-disabled">
              {stat.sublabel}
            </p>
          </div>
        );
      })}
    </div>
  );
};
