"use client";

import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "ripple" | "magnetic" | "shimmer";
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  className,
  onClick,
  variant = "default",
  disabled = false,
}: AnimatedButtonProps) {
  const buttonVariants = {
    default: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    },
    ripple: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    },
    magnetic: {
      whileHover: { scale: 1.03, rotate: 0.5 },
      whileTap: { scale: 0.97 },
    },
    shimmer: {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    },
  };

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-lg px-6 py-3 font-medium transition-colors",
        "bg-white text-black hover:bg-gray-100",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      {...buttonVariants[variant]}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {variant === "ripple" && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-white/20"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {variant === "shimmer" && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          whileHover={{ translateX: "100%" }}
          transition={{ duration: 0.6 }}
        />
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
