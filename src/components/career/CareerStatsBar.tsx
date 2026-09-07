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
      color: "text-[#4267D5]",
      bg: "bg-[#4267D5]/10",
      border: "border-[#4267D5]/20",
    },
    {
      label: "Active Pipeline",
      value: active,
      sublabel: "In progress / reviewing",
      icon: CheckCircle2,
      color: "text-[#D58A00]",
      bg: "bg-[#D58A00]/10",
      border: "border-[#D58A00]/20",
    },
    {
      label: "Offers Received",
      value: offers,
      sublabel: "Ready for decision",
      icon: Trophy,
      color: "text-[#2FA66A]",
      bg: "bg-[#2FA66A]/10",
      border: "border-[#2FA66A]/20",
    },
    {
      label: "Interview Rate",
      value: `${interviewRate}%`,
      sublabel: "Screened to interview",
      icon: TrendingUp,
      color: "text-[#8B5CC7]",
      bg: "bg-[#8B5CC7]/10",
      border: "border-[#8B5CC7]/20",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full select-none"
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-lg bg-surface p-3.5 sm:p-4 border border-border-default shadow-xs hover:border-border-strong transition-colors duration-150 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-medium text-text-muted">
                {stat.label}
              </span>
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded border ${stat.bg} ${stat.color} ${stat.border}`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-mono">
                {stat.value}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-text-muted truncate">
              {stat.sublabel}
            </p>
          </div>
        );
      })}
    </div>
  );
};
