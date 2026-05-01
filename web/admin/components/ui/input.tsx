"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-brand-fg",
        "placeholder:text-brand-fg-dim/60",
        "hover:border-white/20 focus:border-brand-gold/50 focus:outline-none focus:ring-2 focus:ring-brand-gold/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
