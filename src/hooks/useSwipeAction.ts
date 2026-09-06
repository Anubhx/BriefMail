"use client";

import { useMotionValue, PanInfo } from "framer-motion";
import { useState } from "react";

interface UseSwipeActionOptions {
  threshold?: number;
  onArchive?: () => void;
  onSnooze?: () => void;
  onStar?: () => void;
}

export function useSwipeAction({
  threshold = 80,
  onArchive,
  onSnooze,
  onStar,
}: UseSwipeActionOptions = {}) {
  const dragX = useMotionValue(0);
  const [isRevealing, setIsRevealing] = useState<"left" | "right" | null>(null);

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 30) {
      setIsRevealing("right");
    } else if (info.offset.x < -30) {
      setIsRevealing("left");
    } else {
      setIsRevealing(null);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;

    if (offset > threshold) {
      // Swiped right -> Star / Snooze action
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([10, 10, 10]);
      }
      if (onStar) onStar();
      else if (onSnooze) onSnooze();
    } else if (offset < -threshold) {
      // Swiped left -> Archive action
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([10, 10, 10]);
      }
      if (onArchive) onArchive();
    }

    setIsRevealing(null);
  };

  return {
    dragX,
    isRevealing,
    handleDrag,
    handleDragEnd,
  };
}
