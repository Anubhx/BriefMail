"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import type { Variants } from "framer-motion";

type CursorState = "default" | "hover" | "text-hover";

const EASE_CUBIC = [0.22, 1, 0.36, 1] as const;

const ringVariants: Variants = {
  default: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    borderColor: "var(--border-strong)",
    backgroundColor: "rgba(255, 90, 42, 0)",
    transition: { duration: 0.22, ease: EASE_CUBIC },
  },
  hover: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    borderColor: "var(--brand)",
    backgroundColor: "var(--brand-subtle)",
    transition: { duration: 0.22, ease: EASE_CUBIC },
  },
  "text-hover": {
    width: 8,
    height: 44,
    borderRadius: "2px",
    borderColor: "var(--brand)",
    backgroundColor: "rgba(255, 90, 42, 0)",
    transition: { duration: 0.22, ease: EASE_CUBIC },
  },
};

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorState, setCursorState] = useState<CursorState>("default");
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth trailing spring for the outer ring
  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const ringX = useSpring(mouseX, springConfig);
  const ringY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check for touch / mobile screens or reduced motion
    const checkIsTouch = () => {
      const isSmall = window.matchMedia("(max-width: 720px)").matches;
      const isCoarse = window.matchMedia("(pointer: coarse)").matches;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return isSmall || isCoarse || reducedMotion;
    };

    if (checkIsTouch()) {
      setIsTouchDevice(true);
      return;
    }

    setIsTouchDevice(false);
    document.body.classList.add("has-custom-cursor");

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    // Attach delegated hover listeners for data-hover and text elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const hoverEl = target.closest(
        "[data-hover], a, button, input, [role='button']"
      );
      if (hoverEl) {
        setCursorState("hover");
        return;
      }

      const textEl = target.closest(
        "h1, h2, h3, [data-text-hover], .hero-sub, .section-desc"
      );
      if (textEl) {
        setCursorState("text-hover");
        return;
      }

      setCursorState("default");
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY, isVisible]);

  if (isTouchDevice || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Precision inner center dot */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-[#171717] rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
        style={{
          x: mouseX,
          y: mouseY,
          opacity: cursorState === "text-hover" ? 0 : 1,
        }}
        transition={{ duration: 0.1 }}
      />

      {/* Morphing interactive outer ring */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 border pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2"
        style={{
          x: ringX,
          y: ringY,
        }}
        variants={ringVariants}
        animate={cursorState}
      />
    </>
  );
}
