"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface FloatingElementsProps {
  className?: string;
  count?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export function FloatingElements({
  className,
  count = 6,
  size = "md",
  color = "white",
}: FloatingElementsProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  const [elements, setElements] = useState<FloatingElement[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const generatedElements = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    }));
    setElements(generatedElements);
  }, [count]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {isClient &&
        elements.map((element) => (
          <motion.div
            key={element.id}
            className={cn(
              "absolute rounded-full opacity-20",
              sizeClasses[size],
              `bg-${color}`,
            )}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
            }}
            animate={{
              y: [0, -8, 0],
              x: [0, 4, 0],
              scale: [1, 1.05, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: element.duration,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}
