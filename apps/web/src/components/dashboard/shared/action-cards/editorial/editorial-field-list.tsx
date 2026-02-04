"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";
import { EditorialConfirmButton } from "./editorial-confirm-button";

export interface FieldItem {
  /** Label for the field (e.g., "Date:", "Reason:", "Request:") */
  label: string;
  /** Value to display */
  value: string | null | undefined;
  /** Whether the value should be displayed in quotes and italic */
  isQuoted?: boolean;
  /** Custom color class for the value (overrides default) */
  valueColorClass?: string;
  /** Whether the value should be bold */
  isBold?: boolean;
}

interface EditorialFieldListProps {
  /** List of field items to display */
  fields: FieldItem[];
  /** Semantic color variant */
  variant: EditorialVariant;
  /** Whether to show the confirm button */
  showConfirmButton?: boolean;
  /** Callback when confirm is clicked */
  onConfirm?: () => void;
  /** Whether confirm action is in progress */
  isConfirming?: boolean;
  /** Whether the action has been confirmed */
  isConfirmed?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Editorial Field List
 *
 * Key-value pairs display component for action cards.
 * Supports quoted text (italic, muted) and variant-colored values.
 * Confirm button can be displayed on the right side using flexbox.
 */
export function EditorialFieldList({
  fields,
  variant,
  showConfirmButton = false,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: EditorialFieldListProps) {
  const styles = getEditorialVariantStyles(variant);

  // Filter out fields with empty values
  const visibleFields = fields.filter(
    (field) =>
      field.value !== null && field.value !== undefined && field.value !== "",
  );

  if (visibleFields.length === 0 && !showConfirmButton) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className={cn("relative px-5 pb-5 pt-1", className)}
    >
      {/* Gradient overlay - starts from same color and gets lighter */}
      <div
        className={cn(
          "absolute inset-0 top-0",
          "bg-gradient-to-b",
          styles.gradientFrom,
          "to-transparent",
          "pointer-events-none",
        )}
      />

      {/* Flex container: Fields on left, Confirm button on right */}
      <div className="relative flex items-start gap-4">
        {/* Field list - grows to fill space */}
        <div className="flex-1 space-y-2">
          {visibleFields.map((field, index) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
              className="flex items-baseline gap-3"
            >
              {/* Label - smaller, muted */}
              <span className="text-sm font-medium text-muted-foreground shrink-0 min-w-[80px]">
                {field.label}
              </span>

              {/* Value - properly sized based on type */}
              {field.isQuoted ? (
                <span className="text-base italic text-muted-foreground/80 leading-relaxed line-clamp-2 overflow-hidden">
                  "{field.value}"
                </span>
              ) : (
                <span
                  className={cn(
                    "text-lg",
                    field.isBold ? "font-semibold" : "font-medium",
                    field.valueColorClass ?? styles.valueColor,
                  )}
                >
                  {field.value}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Confirm button column on the right */}
        {showConfirmButton && (onConfirm ?? isConfirmed) && (
          <div className="shrink-0 pt-1">
            <EditorialConfirmButton
              onClick={onConfirm}
              isLoading={isConfirming}
              isConfirmed={isConfirmed}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
