"use client";

import { useState } from "react";
import { Mail, ChevronDown, ChevronUp, Eye } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@odis-ai/shared/ui/collapsible";
import { cn } from "@odis-ai/shared/util";
import type { StructuredDischargeContent } from "../types";
import { EmailStructuredPreview } from "./structured-preview";

interface EmailPreviewSectionProps {
  /** Structured content for the email preview */
  structuredContent: StructuredDischargeContent | null;
  /** Fallback email content if no structured content */
  emailContent?: string;
  /** Fallback discharge summary if no email content */
  dischargeSummary?: string;
  /** Whether the section should be open by default */
  defaultOpen?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Email Preview Section
 *
 * A collapsible section that shows a preview of the email
 * that will be sent. Used for scheduled cases where the
 * email hasn't been sent yet.
 */
export function EmailPreviewSection({
  structuredContent,
  emailContent,
  dischargeSummary,
  defaultOpen = false,
  className,
}: EmailPreviewSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Determine what content to show
  const hasStructuredContent = structuredContent?.patientName;
  const hasFallbackContent = emailContent?.trim() || dischargeSummary?.trim();

  // If no content at all, don't render
  if (!hasStructuredContent && !hasFallbackContent) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("rounded-xl border border-slate-200/60 dark:border-slate-700/60", className)}
    >
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              "bg-gradient-to-br from-slate-100/80 to-slate-200/80",
              "dark:from-slate-700/80 dark:to-slate-800/80",
              "group-hover:from-teal-100/80 group-hover:to-teal-200/80",
              "dark:group-hover:from-teal-900/50 dark:group-hover:to-teal-800/50",
              "ring-1 ring-slate-200/30 dark:ring-slate-600/30",
            )}
          >
            <Mail className="h-4 w-4 text-slate-600 group-hover:text-teal-600 dark:text-slate-400 dark:group-hover:text-teal-400" />
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Discharge Email
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400 transition-transform" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400 transition-transform" />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-slate-200/60 p-4 dark:border-slate-700/60">
          {hasStructuredContent ? (
            <EmailStructuredPreview content={structuredContent!} />
          ) : (
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                {emailContent || dischargeSummary}
              </p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
