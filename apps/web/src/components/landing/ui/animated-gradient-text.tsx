"use client";

import { type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { cn } from "@odis-ai/utils";

export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<"span"> {
  /** Animation speed multiplier (default: 1) */
  speed?: number;
  /** Gradient start color (default: teal-500) */
  colorFrom?: string;
  /** Gradient middle color (default: emerald-400) */
  colorVia?: string;
  /** Gradient end color (default: teal-600) */
  colorTo?: string;
}

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#14b8a6",
  colorVia = "#34d399",
  colorTo = "#0d9488",
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-via": colorVia,
          "--color-to": colorTo,
        } as CSSProperties
      }
      className={cn(
        "animate-gradient-text inline bg-gradient-to-r from-[var(--color-from)] via-[var(--color-via)] to-[var(--color-to)] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
