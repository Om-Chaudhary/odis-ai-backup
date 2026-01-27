import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const textVariants = cva("text-foreground", {
  variants: {
    variant: {
      default: "",
      muted: "text-muted-foreground",
      heading: "font-bold",
      label: "font-medium",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "base",
  },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {}

const Text = React.forwardRef<RNText, TextProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <RNText
        ref={ref}
        className={cn(textVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Text.displayName = "Text";

export { Text, textVariants };
