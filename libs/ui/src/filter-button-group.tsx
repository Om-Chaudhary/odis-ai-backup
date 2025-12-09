"use client";

import { Button } from "./button";
import { cn } from "@odis-ai/utils";

interface FilterButtonGroupProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterButtonGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterButtonGroupProps<T>) {
  return (
    <div
      className={cn(
        "transition-smooth inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1 backdrop-blur-sm",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(option.value)}
            className={cn(
              "transition-smooth hover:scale-[1.01] focus:ring-2 focus:ring-[#31aba3] focus:ring-offset-2",
              isActive &&
                "bg-[#31aba3] text-white shadow-sm hover:bg-[#2a9a92]",
            )}
            aria-pressed={isActive}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
