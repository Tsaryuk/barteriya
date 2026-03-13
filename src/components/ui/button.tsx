"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-2xl active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-brand-amber text-white hover:bg-brand-amber-dark shadow-warm hover:shadow-lg":
              variant === "primary",
            "bg-warm-100 text-warm-800 hover:bg-warm-200":
              variant === "secondary",
            "border-2 border-warm-200 text-warm-700 hover:border-brand-amber hover:text-brand-amber bg-transparent":
              variant === "outline",
            "text-warm-600 hover:text-warm-800 hover:bg-warm-100 bg-transparent":
              variant === "ghost",
            "bg-brand-coral text-white hover:bg-red-600":
              variant === "danger",
          },
          {
            "text-sm px-4 py-2": size === "sm",
            "text-sm px-6 py-3": size === "md",
            "text-base px-8 py-4": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
