"use client";

import { motion } from "framer-motion";
import { cn } from "@odis/utils";

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function TextReveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = "up",
}: TextRevealProps) {
  const directionVariants = {
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
    left: { x: 20, opacity: 0 },
    right: { x: -20, opacity: 0 },
  };

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={directionVariants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{
        duration: duration + 0.2,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
