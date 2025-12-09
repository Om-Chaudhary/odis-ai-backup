"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@odis-ai/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  format?: (value: number) => string;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  format = (val) => val.toLocaleString(),
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const previousValueRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Skip if value is invalid
    if (value === undefined || isNaN(value) || value < 0) {
      return;
    }

    // On first render with a valid value, always start from 0
    if (previousValueRef.current === null) {
      previousValueRef.current = 0;
      setDisplayValue(0);
      hasStartedRef.current = true;
    }

    // Wait until we've initialized
    if (!hasStartedRef.current) {
      return;
    }

    const startTime = Date.now() + delay;
    const previousValue = previousValueRef.current ?? 0;
    const difference = value - previousValue;
    const duration = 1500; // 1.5 second animation (slower, more visible)

    // Only animate if there's a meaningful difference
    if (Math.abs(difference) < 0.01) {
      setDisplayValue(value);
      setIsVisible(true);
      previousValueRef.current = value;
      return;
    }

    setIsAnimating(true);

    const animate = () => {
      const now = Date.now();
      if (now < startTime) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Show the number when animation actually starts (after delay)
      setIsVisible(true);

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = previousValue + difference * easeOutCubic;

      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        setIsAnimating(false);
        previousValueRef.current = value;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, delay, direction]);

  return (
    <span
      className={cn(
        "tabular-nums transition-all duration-300",
        isAnimating && "scale-105",
        !isVisible && "opacity-0",
        className,
      )}
    >
      {format(displayValue)}
    </span>
  );
}
