"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface EmailListEntranceProps {
  children: React.ReactNode;
}

export const EmailListEntrance: React.FC<EmailListEntranceProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".briefmail-list-item", {
        y: 16,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
        clearProps: "all",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-2 w-full">
      {children}
    </div>
  );
};
