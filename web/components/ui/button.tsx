"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg",
  {
    variants: {
      variant: {
        // Primary action — Robinhood Gold uses a solid warm gold for the
        // "Subscribe" CTA. We mirror that here for buy/deposit actions.
        gold: "bg-brand-gold text-black hover:bg-brand-gold-soft active:scale-[0.98]",
        // Inverted: ivory pill, dark text — for secondary CTAs.
        primary: "bg-brand-fg text-black hover:bg-white active:scale-[0.98]",
        // Subtle outline — used for "log in", "view all" style actions.
        outline:
          "border border-white/15 bg-transparent text-brand-fg hover:border-white/30 hover:bg-white/5",
        // Quiet ghost for inline / row-level actions.
        ghost: "bg-white/5 text-brand-fg hover:bg-white/10",
        danger: "bg-red-500/90 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
