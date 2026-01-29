"use client";

import { motion } from "framer-motion";
import { FileText, User, PawPrint, Phone, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { formatCallSummary } from "@odis-ai/shared/util/text-formatting";

interface SummaryTabProps {
  /** Call summary text */
  summary: string | null;
  /** Additional className */
  className?: string;
}

/**
 * Summary Tab Content - Redesigned
 *
 * Simplified to show only call summary text.
 * Audio player and actions moved to Call tab and action cards respectively.
 *
 * Features refined, clinical-yet-warm aesthetic with IBM Plex Sans typography.
 */
export function SummaryTab({ summary, className }: SummaryTabProps) {
  // Extract call status for header display
  const callStatus = extractCallStatus(summary);

  return (
    <div
      className={cn("space-y-4", className)}
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
    >
      {/* Summary text */}
      {summary ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl"
        >
          {/* Refined background with subtle warmth */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-slate-50/90 via-white/80 to-teal-50/40",
              "dark:from-slate-900/90 dark:via-slate-800/80 dark:to-teal-950/40",
              "ring-1 ring-slate-200/60 dark:ring-slate-700/60",
            )}
          />

          {/* Content */}
          <div className="relative p-5">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-teal-500/15 to-teal-600/10",
                  "ring-1 ring-teal-500/20",
                )}
              >
                <FileText className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                Call Summary
              </h3>
              {/* Call Status Badge */}
              {callStatus && (
                <span
                  className={cn(
                    "ml-auto px-2.5 py-1 rounded-full text-xs font-medium",
                    callStatus.colors.text,
                    callStatus.colors.bg
                  )}
                >
                  {callStatus.status}
                </span>
              )}
            </div>

            {/* Summary text with enhanced formatting */}
            <div
              className={cn(
                "space-y-3 text-slate-700 dark:text-slate-300",
              )}
            >
              {formatEnhancedCallSummary(summary)}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-700"
        >
          <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No summary available for this call
          </p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Extract call status from summary text for header display
 */
function extractCallStatus(summary: string | null): { status: string; colors: { text: string; bg: string } } | null {
  if (!summary) return null;

  // Look for CALL STATUS field in markdown format
  const markdownMatch = /\*\*CALL STATUS:\*\*\s*([^\n*]+)/i.exec(summary);
  if (markdownMatch?.[1]) {
    const status = markdownMatch[1].trim();
    const statusLower = status.toLowerCase();

    if (statusLower.includes('complete')) {
      return {
        status,
        colors: { text: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30' }
      };
    } else if (statusLower.includes('incomplete')) {
      return {
        status,
        colors: { text: 'text-orange-700', bg: 'bg-orange-100 dark:bg-orange-900/30' }
      };
    } else if (statusLower.includes('abandoned')) {
      return {
        status,
        colors: { text: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' }
      };
    }

    // Default styling for other statuses
    return {
      status,
      colors: { text: 'text-slate-700', bg: 'bg-slate-100 dark:bg-slate-800' }
    };
  }

  // Look for plain text format
  const plainTextMatch = /^CALL STATUS:\s*(.+)$/mi.exec(summary);
  if (plainTextMatch?.[1]) {
    const status = plainTextMatch[1].trim();
    return {
      status,
      colors: { text: 'text-slate-700', bg: 'bg-slate-100 dark:bg-slate-800' }
    };
  }

  return null;
}

/**
 * Enhanced call summary formatter with better visual hierarchy
 * Parses VAPI summary format and creates structured, scannable layout
 */
function formatEnhancedCallSummary(summary: string | null) {
  if (!summary) return null;

  // Icon mapping for different field types
  const iconMap: Record<string, React.ReactNode> = {
    'CALLER': <User className="h-4 w-4" />,
    'PET': <PawPrint className="h-4 w-4" />,
    'REASON FOR CALL': <Phone className="h-4 w-4" />,
    'REASON': <Phone className="h-4 w-4" />, // New simplified field name
    'ACTION TAKEN': <CheckCircle className="h-4 w-4" />,
    'ACTION': <CheckCircle className="h-4 w-4" />, // New simplified field name
    'CONTEXT': <AlertTriangle className="h-4 w-4" />, // For abandoned/incomplete calls
    'FOLLOW-UP': <Calendar className="h-4 w-4" />, // For incomplete calls
  };

  // Color mapping for different field types
  const getFieldColors = (fieldName: string, value: string) => {
    // Green styling for completed actions
    if ((fieldName === 'ACTION TAKEN' || fieldName === 'ACTION') && value.toLowerCase() !== 'no') {
      return {
        icon: 'text-green-500',
        label: 'text-green-600 font-semibold',
        value: 'text-green-700 font-medium'
      };
    }

    // Orange styling for context/follow-up (incomplete/abandoned)
    if (fieldName === 'CONTEXT' || fieldName === 'FOLLOW-UP') {
      return {
        icon: 'text-orange-500',
        label: 'text-orange-600 font-semibold dark:text-orange-400',
        value: 'text-orange-700 dark:text-orange-300'
      };
    }

    return {
      icon: 'text-teal-500',
      label: 'text-slate-600 font-semibold dark:text-slate-400',
      value: 'text-slate-700 dark:text-slate-300'
    };
  };

  // Try to parse VAPI markdown format first
  const sections: Array<{ type: 'field' | 'details'; content: any }> = [];

  // Check if this looks like VAPI markdown format with **FIELD:** patterns
  const markdownFieldPattern = /\*\*([^*:]+):\*\*\s*([^\n*]+)/g;
  const markdownMatches = [...summary.matchAll(markdownFieldPattern)];

  if (markdownMatches.length > 0) {
    // Parse as VAPI markdown format, but exclude KEY DETAILS from fields
    for (const match of markdownMatches) {
      const fieldName = match[1]?.trim();
      const fieldValue = match[2]?.trim();

      // Skip KEY DETAILS, deprecated fields, and CALL STATUS (shown in header)
      if (fieldName && fieldValue &&
          fieldName !== 'KEY DETAILS' &&
          fieldName !== 'URGENCY' &&
          fieldName !== 'FOLLOW-UP NEEDED' &&
          fieldName !== 'CALL STATUS') {
        sections.push({
          type: 'field',
          content: { name: fieldName, value: fieldValue }
        });
      }
    }

    // Look for KEY DETAILS section (usually at the end)
    const keyDetailsMatch = /\*\*KEY DETAILS:\*\*\s*([\s\S]*?)(?:\*\*[^*]+:\*\*|$)/.exec(summary);
    if (keyDetailsMatch) {
      const detailsContent = keyDetailsMatch[1]?.trim();
      if (detailsContent) {
        sections.push({
          type: 'details',
          content: detailsContent
        });
      }
    }
  } else {
    // Fallback to original parsing for plain text format
    const lines = summary.split('\n').filter(line => line.trim());
    let currentDetailsSection: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line matches field pattern (FIELD: value)
      const fieldMatch = /^([A-Z\s]+):\s*(.+)$/.exec(trimmed);

      if (fieldMatch) {
        // If we have accumulated details, add them as a section
        if (currentDetailsSection.length > 0) {
          sections.push({
            type: 'details',
            content: currentDetailsSection.join('\n')
          });
          currentDetailsSection = [];
        }

        // Add field section (skip deprecated fields and CALL STATUS)
        const [, fieldName, fieldValue] = fieldMatch;
        if (fieldName && fieldValue &&
            fieldName.trim() !== 'URGENCY' &&
            fieldName.trim() !== 'FOLLOW-UP NEEDED' &&
            fieldName.trim() !== 'CALL STATUS') {
          sections.push({
            type: 'field',
            content: { name: fieldName.trim(), value: fieldValue.trim() }
          });
        }
      } else if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.includes('presenting')) {
        // This is part of details/key details section
        currentDetailsSection.push(trimmed);
      }
    }

    // Add any remaining details
    if (currentDetailsSection.length > 0) {
      sections.push({
        type: 'details',
        content: currentDetailsSection.join('\n')
      });
    }
  }

  // If no structured sections found, fall back to original formatter
  if (sections.length === 0) {
    return (
      <div className="text-sm leading-relaxed">
        {formatCallSummary(summary)}
      </div>
    );
  }

  // Sort fields by preferred order: ACTION/ACTION TAKEN should be last before KEY DETAILS
  // CALL STATUS is now displayed in header, so exclude from field list
  // Support both old and new field names
  const fieldOrder = ['CALLER', 'PET', 'REASON FOR CALL', 'REASON', 'ACTION TAKEN', 'ACTION', 'CONTEXT', 'FOLLOW-UP'];
  const fieldSections = sections.filter(s => s.type === 'field');
  const detailsSections = sections.filter(s => s.type === 'details');

  // Sort field sections by the preferred order
  fieldSections.sort((a, b) => {
    const aIndex = fieldOrder.indexOf(a.content.name);
    const bIndex = fieldOrder.indexOf(b.content.name);

    // If field not in order list, put it at the end
    const aOrder = aIndex === -1 ? 999 : aIndex;
    const bOrder = bIndex === -1 ? 999 : bIndex;

    return aOrder - bOrder;
  });

  // Combine sorted fields with details at the end
  const sortedSections = [...fieldSections, ...detailsSections];

  return (
    <div className="space-y-3">
      {sortedSections.map((section, index) => {
        if (section.type === 'field') {
          const { name, value } = section.content;
          const colors = getFieldColors(name, value);
          const icon = iconMap[name];

          return (
            <div key={index} className="flex items-start gap-3 py-1">
              {/* Icon */}
              <div className={cn("mt-0.5", colors.icon)}>
                {icon || <FileText className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={cn("text-sm uppercase tracking-wide", colors.label)}>
                    {name}:
                  </span>
                  <span className={cn("text-sm leading-relaxed", colors.value)}>
                    {value}
                  </span>
                </div>
              </div>
            </div>
          );
        } else {
          // Details section
          return (
            <div key={index} className="rounded-lg bg-slate-50/60 dark:bg-slate-800/40 p-4 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Key Details
                </span>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-1">
                {section.content.split('\n').map((detail: string, detailIndex: number) => (
                  <div key={detailIndex}>{detail}</div>
                ))}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}
