"use client";

import { cn } from "@odis-ai/shared/util";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  src?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

/**
 * Extension-compatible Logo component
 * Uses standard <img> tag instead of Next.js Image
 */
export function Logo({
  className,
  size = "md",
  src = "/icon-128.png",
}: LogoProps) {
  return (
    <img
      src={src}
      alt="Odis AI Logo"
      className={cn(sizeClasses[size], className)}
    />
  );
}
