"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "~/lib/utils";

interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  /** Gradient direction */
  direction?:
    | "to-r"
    | "to-l"
    | "to-t"
    | "to-b"
    | "to-br"
    | "to-bl"
    | "to-tr"
    | "to-tl";
  /** From color (Tailwind class without 'from-' prefix) */
  from?: string;
  /** Via color (Tailwind class without 'via-' prefix) - optional middle color */
  via?: string;
  /** To color (Tailwind class without 'to-' prefix) */
  to?: string;
  /** Use brand teal-to-emerald gradient */
  brand?: boolean;
}

const GradientText = forwardRef<HTMLSpanElement, GradientTextProps>(
  (
    {
      className,
      direction = "to-r",
      from = "teal-500",
      via,
      to = "emerald-500",
      brand = false,
      children,
      ...props
    },
    ref,
  ) => {
    // Brand gradient preset
    const gradientClasses = brand
      ? "from-teal-500 via-emerald-500 to-teal-400"
      : `from-${from} ${via ? `via-${via}` : ""} to-${to}`;

    return (
      <span
        ref={ref}
        className={cn(
          "bg-gradient-to-r bg-clip-text text-transparent",
          `bg-gradient-${direction}`,
          // We use inline style for the gradient colors to ensure dynamic values work
          className,
        )}
        style={{
          backgroundImage: brand
            ? "linear-gradient(to right, #14b8a6, #10b981, #14b8a6)"
            : undefined,
        }}
        {...props}
      >
        {children}
      </span>
    );
  },
);

GradientText.displayName = "GradientText";

// Preset components for common use cases
export function BrandGradientText({
  className,
  children,
  ...props
}: Omit<GradientTextProps, "brand" | "from" | "via" | "to">) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 bg-clip-text text-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { GradientText };
