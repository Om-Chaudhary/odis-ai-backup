import React from "react";
import { TouchableOpacity, View, type TouchableOpacityProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        outline: "border border-primary bg-transparent",
        ghost: "bg-transparent",
        destructive: "bg-destructive",
      },
      size: {
        default: "px-4 py-4",
        sm: "px-3 py-2",
        lg: "px-6 py-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends TouchableOpacityProps,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant, size, disabled, children, ...props }, ref) => {
    return (
      <TouchableOpacity
        ref={ref as React.Ref<TouchableOpacity>}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        activeOpacity={0.7}
        style={disabled ? { opacity: 0.5 } : undefined}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
