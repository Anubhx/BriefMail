"use client";

import React from "react";
import Link from "next/link";

interface SplitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: string;
  className?: string;
  href?: string;
}

export function SplitButton({
  children,
  className = "",
  href,
  ...props
}: SplitButtonProps) {
  const chars = children.split("");

  const content = (
    <>
      {/* Default text layer (slides up & skews on hover) */}
      <span className="flex items-center" aria-hidden="true">
        {chars.map((char, index) => (
          <span
            key={index}
            style={{
              transitionDelay: `${index * 16}ms`,
            }}
            className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-[130%] group-hover:skew-y-3 group-hover:opacity-0"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Hover text layer (slides up into view from below) */}
      <span
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {chars.map((char, index) => (
          <span
            key={index}
            style={{
              transitionDelay: `${index * 16}ms`,
            }}
            className="inline-block translate-y-[130%] opacity-0 transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 group-hover:opacity-100"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Accessible screen-reader text */}
      <span className="sr-only">{children}</span>
    </>
  );

  const baseClasses = `group relative inline-flex items-center justify-center overflow-hidden rounded-[7px] bg-[var(--brand)] px-5 py-2.5 font-ui text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] transition-all duration-200 hover:bg-[var(--brand-hover)] active:scale-[0.97] min-h-[44px] cursor-pointer select-none ${className}`;

  if (href) {
    return (
      <Link href={href} data-hover className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button
      {...props}
      data-hover
      className={baseClasses}
    >
      {content}
    </button>
  );
}
