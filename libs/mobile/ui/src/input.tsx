import React from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { cn } from "./utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <View>
        {label && (
          <Text className="mb-2 font-medium text-foreground">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            "rounded-lg border border-input bg-card px-4 py-3 text-foreground",
            error && "border-destructive",
            className
          )}
          placeholderTextColor="#6b7280"
          {...props}
        />
        {error && (
          <Text className="mt-1 text-sm text-destructive">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

export { Input };
