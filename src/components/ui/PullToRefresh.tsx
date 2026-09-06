"use client";

import React, { useState, useRef, TouchEvent } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  pullThreshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  pullThreshold = 60,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const dragY = useMotionValue(0);

  const opacity = useTransform(dragY, [0, pullThreshold], [0, 1]);
  const rotate = useTransform(dragY, [0, pullThreshold * 1.5], [0, 360]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (isRefreshing || touchStartY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0 && typeof window !== "undefined" && window.scrollY === 0) {
      // Add rubber band resistance calculation
      dragY.set(Math.pow(diff, 0.85));
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) return;

    const currentDrag = dragY.get();
    touchStartY.current = 0;

    if (currentDrag >= pullThreshold) {
      setIsRefreshing(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore error
        }
      }

      animate(dragY, pullThreshold, { type: "spring", stiffness: 300, damping: 25 });
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
      }
    } else {
      animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull Refresh Indicator Header */}
      <motion.div
        style={{ y: dragY }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center -translate-y-12 z-30 pointer-events-none"
      >
        <motion.div
          style={{ opacity, rotate }}
          className="w-9 h-9 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center shadow-lg text-brand"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </motion.div>
      </motion.div>

      {/* Rubber-band Content Wrapper */}
      <motion.div style={{ y: dragY }} className="min-h-full">
        {children}
      </motion.div>
    </div>
  );
}
