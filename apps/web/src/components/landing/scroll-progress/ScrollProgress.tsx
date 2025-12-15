"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    setProgress(scrollPercent);
    setIsVisible(scrollTop > 50);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(calculateProgress);
    };

    // Initial calculation
    calculateProgress();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [calculateProgress]);

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-[100] h-1 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Background track */}
      <div className="bg-muted/30 absolute inset-0 backdrop-blur-sm" />

      {/* Progress bar with gradient */}
      <div
        className="relative h-full transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      >
        {/* Main gradient bar */}
        <div className="from-primary via-primary/80 to-primary absolute inset-0 bg-gradient-to-r" />

        {/* Animated shimmer effect */}
        <div
          className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{
            backgroundSize: "200% 100%",
          }}
        />

        {/* Glow effect at the leading edge */}
        <div
          className="bg-primary/60 absolute top-1/2 right-0 h-4 w-8 -translate-y-1/2 blur-md"
          style={{
            transform: "translateY(-50%)",
          }}
        />
      </div>
    </div>
  );
}
