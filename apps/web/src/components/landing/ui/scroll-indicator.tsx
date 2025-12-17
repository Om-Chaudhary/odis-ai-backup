"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/utils";
import { ChevronDown } from "lucide-react";
import { usePageLoaded } from "~/hooks/use-page-loaded";

interface ScrollIndicatorProps {
  className?: string;
  targetId?: string;
  label?: string;
}

export function ScrollIndicator({
  className,
  targetId = "#features",
  label = "Scroll to explore",
}: ScrollIndicatorProps) {
  const isPageLoaded = usePageLoaded(150);

  const handleClick = () => {
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, y: -10 }}
      animate={isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className={cn(
        "group flex flex-col items-center gap-2 text-slate-400 transition-colors hover:text-slate-600",
        className,
      )}
      aria-label={label}
    >
      <span className="text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center"
      >
        <ChevronDown className="h-5 w-5 opacity-60 transition-opacity group-hover:opacity-100" />
        <ChevronDown className="-mt-3 h-5 w-5 opacity-30 transition-opacity group-hover:opacity-60" />
      </motion.div>
    </motion.button>
  );
}

// Minimal mouse scroll animation variant
export function ScrollMouseIndicator({
  className,
  targetId = "#features",
}: Pick<ScrollIndicatorProps, "className" | "targetId">) {
  const isPageLoaded = usePageLoaded(150);

  const handleClick = () => {
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, y: -10 }}
      animate={isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className={cn("group flex flex-col items-center gap-3", className)}
      aria-label="Scroll to explore"
    >
      {/* Mouse outline */}
      <div className="relative h-10 w-6 rounded-full border-2 border-slate-300 transition-colors group-hover:border-slate-400">
        {/* Scroll wheel dot */}
        <motion.div
          animate={{ y: [2, 10, 2] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-2 left-1/2 h-2 w-1 -translate-x-1/2 rounded-full bg-slate-400 transition-colors group-hover:bg-slate-500"
        />
      </div>
    </motion.button>
  );
}
