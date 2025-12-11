"use client";

import { Button } from "@odis-ai/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@odis-ai/ui/dropdown-menu";
import {
  ThumbsUp,
  ThumbsDown,
  Voicemail,
  PhoneMissed,
  AlertCircle,
  Clock,
  Flag,
  ChevronDown,
} from "lucide-react";
import type { ReviewCategory } from "~/server/api/routers/admin-discharge-calls";

interface ReviewCategorySelectorProps {
  value: ReviewCategory;
  onChange: (category: ReviewCategory) => void;
  disabled?: boolean;
  compact?: boolean;
}

const categories: {
  value: ReviewCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}[] = [
  { value: "to_review", label: "To Review", icon: Clock, shortcut: "R" },
  { value: "good", label: "Good", icon: ThumbsUp, shortcut: "G" },
  { value: "bad", label: "Bad", icon: ThumbsDown, shortcut: "B" },
  { value: "voicemail", label: "Voicemail", icon: Voicemail, shortcut: "V" },
  { value: "failed", label: "Failed", icon: AlertCircle, shortcut: "F" },
  { value: "no_answer", label: "No Answer", icon: PhoneMissed, shortcut: "N" },
  { value: "needs_followup", label: "Follow-up", icon: Flag, shortcut: "U" },
];

export function ReviewCategorySelector({
  value,
  onChange,
  disabled,
  compact,
}: ReviewCategorySelectorProps) {
  const current = categories.find((c) => c.value === value) ?? categories[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          disabled={disabled}
          className="min-w-[120px] justify-between"
        >
          <span className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4" />
            {!compact && current.label}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs text-slate-500">
          Set Review Category
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <DropdownMenuItem
              key={category.value}
              onClick={() => onChange(category.value)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {category.label}
              </span>
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {category.shortcut}
              </kbd>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick action buttons for inline triage
export function QuickCategoryButtons({
  onSelect,
  disabled,
}: {
  onSelect: (category: ReviewCategory) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSelect("good")}
        disabled={disabled}
        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        title="Mark as Good (G)"
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSelect("bad")}
        disabled={disabled}
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
        title="Mark as Bad (B)"
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSelect("voicemail")}
        disabled={disabled}
        className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
        title="Mark as Voicemail (V)"
      >
        <Voicemail className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onSelect("needs_followup")}
        disabled={disabled}
        className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
        title="Needs Follow-up (U)"
      >
        <Flag className="h-4 w-4" />
      </Button>
    </div>
  );
}

export { categories };
