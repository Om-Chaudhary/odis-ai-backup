"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@odis/utils";

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-[#31aba3] text-white hover:bg-[#2a9a92] hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-[#31aba3]/30",
        secondary:
          "bg-white text-[#31aba3] border border-[#31aba3]/60 hover:bg-[#31aba3] hover:text-white hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-[#31aba3]/20",
        outline:
          "border border-[#31aba3]/60 text-[#31aba3] hover:bg-[#31aba3] hover:text-white hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-[#31aba3]/20",
        ghost: "text-[#31aba3] hover:bg-[#31aba3]/10 hover:scale-105",
        link: "text-[#31aba3] underline-offset-4 hover:underline hover:scale-105",
        gradient:
          "bg-gradient-to-r from-[#31aba3] to-[#2a9a92] text-white hover:from-[#2a9a92] hover:to-[#31aba3] hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-[#31aba3]/30",
        shimmer:
          "bg-[#31aba3] text-white hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-[#31aba3]/30 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        pulse:
          "bg-[#31aba3] text-white hover:scale-105 shadow-lg hover:shadow-2xl hover:shadow-[#31aba3]/30 animate-pulse hover:animate-none",
      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-10 px-6 py-2 text-sm",
        lg: "h-14 px-10 py-4 text-lg",
        xl: "h-16 px-12 py-5 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      iconPosition = "right",
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-inherit">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === "left" && (
            <span className="transition-transform group-hover:scale-110">
              {icon}
            </span>
          )}
          {children}
          {icon && iconPosition === "right" && (
            <span className="transition-transform group-hover:translate-x-1">
              {icon}
            </span>
          )}
        </span>

        {/* Ripple effect overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
        </div>
      </Comp>
    );
  },
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, enhancedButtonVariants };
