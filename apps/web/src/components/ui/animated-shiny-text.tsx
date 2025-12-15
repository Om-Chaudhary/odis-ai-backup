"use client";

import { type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cn } from "~/lib/utils";

export interface AnimatedShinyTextProps
  extends ComponentPropsWithoutRef<"span"> {
  /** Width of the shimmer effect in pixels (default: 100) */
  shimmerWidth?: number;
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
  ...props
}: AnimatedShinyTextProps) {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        // Base text styling
        "inline-block",
        // Shine effect animation
        "animate-shiny-text bg-[length:var(--shiny-width)_100%] bg-clip-text bg-no-repeat [background-position:0_0]",
        // Shine gradient - using teal/emerald colors
        "bg-gradient-to-r from-transparent via-teal-600/80 via-50% to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

