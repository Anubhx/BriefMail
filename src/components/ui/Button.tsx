"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-ui font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-pressed shadow-xs",
      secondary: "bg-surface-elevated text-text-primary border border-border-default hover:bg-surface-subtle",
      ghost: "bg-transparent text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
