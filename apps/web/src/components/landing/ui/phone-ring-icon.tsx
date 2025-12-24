"use client";

import { Phone } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface PhoneRingIconProps {
  className?: string;
  /** Size of the icon */
  size?: number;
  /** Enable ringing animation */
  ringing?: boolean;
}

export function PhoneRingIcon({
  className,
  size = 16,
  ringing = true,
}: PhoneRingIconProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        ringing && "animate-phone-ring",
        className,
      )}
      style={{
        // Ensure animation respects reduced motion
        animationPlayState: "var(--animation-play-state, running)",
      }}
    >
      <Phone size={size} />
    </span>
  );
}
