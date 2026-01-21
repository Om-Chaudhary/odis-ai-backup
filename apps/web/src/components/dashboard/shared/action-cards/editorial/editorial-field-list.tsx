"use client";

import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import {
  type EditorialVariant,
  getEditorialVariantStyles,
} from "./editorial-card-base";

export interface FieldItem {
  /** Label for the field (e.g., "Name", "Reason", "Time") */
  label: string;
  /** Value to display */
  value: string | null | undefined;
  /** Optional icon or badge to display before the value */
  prefix?: React.ReactNode;
}

interface EditorialFieldListProps {
  /** Section label (e.g., "PATIENT DETAILS", "REQUEST DETAILS") */
  sectionLabel: string;
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
 * Key-value pairs display component with serif labels (Lora)
 * and sans-serif values. Print-inspired with thin rule separator.
 */
export function EditorialFieldList({
  sectionLabel,
  fields,
  variant,
  className,
}: EditorialFieldListProps) {
  const styles = getEditorialVariantStyles(variant);

  // Filter out fields with empty values
  const visibleFields = fields.filter(
    (field) => field.value !== null && field.value !== undefined && field.value !== "",
  );

  if (visibleFields.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className={cn("px-5", className)}
    >
      {/* Thin rule separator */}
      <div className="h-px bg-border/60 mb-3" />

      {/* Section label - uppercase, tracking-wide, serif */}
      <span
        className={cn(
          "font-serif text-[11px] font-normal uppercase tracking-[0.2em]",
          styles.sectionLabelColor,
        )}
      >
        {sectionLabel}
      </span>

      {/* Field list */}
      <div className="mt-3 space-y-2">
        {visibleFields.map((field, index) => (
          <motion.div
            key={field.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.25 }}
            className="flex items-baseline gap-3"
          >
            {/* Label - serif, lighter weight */}
            <span className="font-serif text-[13px] font-normal text-muted-foreground min-w-[72px]">
              {field.label}
            </span>

            {/* Value - sans, medium weight */}
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              {field.prefix}
              {field.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
