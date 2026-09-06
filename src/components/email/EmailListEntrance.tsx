"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@/hooks/useGSAP";

interface EmailListEntranceProps {
  children: React.ReactNode;
}

export const EmailListEntrance: React.FC<EmailListEntranceProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef<boolean>(false);

  useGSAP(
    () => {
      // Only animate on initial mount, skip on category switches
      if (hasAnimatedRef.current) return;

      const items = containerRef.current?.querySelectorAll(".briefmail-list-item");
      if (items && items.length > 0) {
        gsap.from(items, {
          y: 20,
          opacity: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "all",
        });
        hasAnimatedRef.current = true;
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="flex flex-col gap-2 w-full">
      {children}
    </div>
  );
};
