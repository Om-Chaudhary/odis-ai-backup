"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "~/lib/utils";

export const Compare = ({
  firstImage,
  secondImage,
  className,
  firstImageClassName,
  secondImageClassname,
  initialSliderPercentage = 50,
  slideMode = "hover",
  showHandlebar = true,
  autoplay = false,
  autoplayDuration = 5000,
}: {
  firstImage: string;
  secondImage: string;
  className?: string;
  firstImageClassName?: string;
  secondImageClassname?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialSliderPercentage);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const percent = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percent)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (slideMode !== "hover") return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (slideMode !== "drag") return;
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  React.useEffect(() => {
    if (autoplay) {
      const interval = setInterval(() => {
        setSliderPosition((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, autoplayDuration / 100);

      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDuration]);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        aspectRatio: "16/9",
      }}
      onMouseMove={slideMode === "hover" ? handleMouseMove : handleDragMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Second Image (right side) */}
      <div className="absolute inset-0">
        <img
          alt="second"
          src={secondImage}
          className={cn(
            "pointer-events-none h-full w-full object-cover select-none",
            secondImageClassname,
          )}
        />
      </div>

      {/* First Image (left side) */}
      <div
        className="absolute inset-0 z-10 overflow-hidden"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <img
          alt="first"
          src={firstImage}
          className={cn(
            "pointer-events-none h-full w-full object-cover select-none",
            firstImageClassName,
          )}
        />
      </div>

      {/* Slider */}
      {showHandlebar && (
        <div
          className="absolute inset-y-0 z-20 flex items-center"
          style={{
            left: `${sliderPosition}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex h-full w-1 items-center justify-center bg-white">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white/10 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};
