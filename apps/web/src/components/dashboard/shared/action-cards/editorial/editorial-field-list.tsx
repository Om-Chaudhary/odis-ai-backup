"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";

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
  /** Additional className */
  className?: string;
}

/**
 * Editorial Field List
 *
 * Key-value pairs display component for action cards.
 * Supports quoted text (italic, muted) and variant-colored values.
 */
export function EditorialFieldList({
  fields,
  variant,
  className,
}: EditorialFieldListProps) {
  const styles = getEditorialVariantStyles(variant);

  // Filter out fields with empty values
  const visibleFields = fields.filter(
    (field) =>
      field.value !== null && field.value !== undefined && field.value !== "",
  );

  if (visibleFields.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className={cn("px-5 pb-5 pt-1", className)}
    >
      {/* Field list */}
      <div className="space-y-1.5">
        {visibleFields.map((field, index) => (
          <motion.div
            key={field.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
            className="flex items-baseline gap-3"
          >
            {/* Label */}
            <span className="text-sm text-muted-foreground shrink-0">
              {field.label}
            </span>

            {/* Value */}
            {field.isQuoted ? (
              <span className="text-sm italic text-muted-foreground">
                "{field.value}"
              </span>
            ) : (
              <span
                className={cn(
                  "text-lg",
                  field.isBold && "font-semibold",
                  field.valueColorClass ?? styles.valueColor,
                )}
              >
                {field.value}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
