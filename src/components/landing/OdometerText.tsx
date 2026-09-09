"use client";

import { useEffect, useRef, useState } from "react";

interface OdometerTextProps {
  value: string;
  className?: string;
}

export function OdometerText({ value, className = "" }: OdometerTextProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // If it's a numeric/latency value like <5ms, ~200ms, ~1s, animate on entry
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;

            // Numeric roll-up simulation
            if (value.includes("200")) {
              let current = 0;
              const interval = setInterval(() => {
                current += 20;
                if (current >= 200) {
                  setDisplayValue("~200ms");
                  clearInterval(interval);
                } else {
                  setDisplayValue(`~${current}ms`);
                }
              }, 25);
            } else if (value.includes("5ms")) {
              let current = 25;
              const interval = setInterval(() => {
                current -= 2;
                if (current <= 5) {
                  setDisplayValue("<5ms");
                  clearInterval(interval);
                } else {
                  setDisplayValue(`<${current}ms`);
                }
              }, 30);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={containerRef} className={className}>
      {displayValue}
    </span>
  );
}
