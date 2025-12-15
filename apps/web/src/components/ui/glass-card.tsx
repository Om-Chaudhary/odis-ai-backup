"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "~/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable floating animation */
  floating?: boolean;
  /** Animation delay for staggered reveals */
  animationDelay?: number;
  /** Float animation duration in seconds */
  floatDuration?: number;
  /** Float animation distance in pixels */
  floatDistance?: number;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      floating = false,
      animationDelay = 0,
      floatDuration = 3,
      floatDistance = 8,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glassmorphism styles
          "rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl",
          // Soft shadow
          "shadow-xl shadow-black/[0.03]",
          // Floating animation class (controlled by CSS)
          floating && "animate-float",
          className,
        )}
        style={{
          ...style,
          ...(floating &&
            ({
              "--float-duration": `${floatDuration}s`,
              "--float-distance": `${floatDistance}px`,
              animationDelay: `${animationDelay}s`,
            } as React.CSSProperties)),
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";

// Animated version using Framer Motion
interface AnimatedGlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Enable floating animation */
  floating?: boolean;
  /** Float animation duration in seconds */
  floatDuration?: number;
  /** Float animation distance in pixels */
  floatDistance?: number;
}

const AnimatedGlassCard = forwardRef<HTMLDivElement, AnimatedGlassCardProps>(
  (
    {
      className,
      floating = false,
      floatDuration = 3,
      floatDistance = 8,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          // Base glassmorphism styles
          "rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl",
          // Soft shadow
          "shadow-xl shadow-black/[0.03]",
          className,
        )}
        {...(floating && {
          animate: {
            y: [0, -floatDistance, 0],
          },
          transition: {
            duration: floatDuration,
            repeat: Infinity,
            ease: "easeInOut",
          },
        })}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

AnimatedGlassCard.displayName = "AnimatedGlassCard";

export { GlassCard, AnimatedGlassCard };
