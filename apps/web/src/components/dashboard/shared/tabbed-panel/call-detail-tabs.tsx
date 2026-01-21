"use client";

import { FileText, Zap } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@odis-ai/shared/ui/tabs";
import { SummaryTab } from "./summary-tab";
import { ActionsTab } from "./actions-tab";

interface CallDetailTabsProps {
  /** Call summary text */
  summary: string | null;
  /** Recording URL */
  recordingUrl: string | null;
  /** Transcript text */
  transcript: string | null;
  /** Cleaned transcript (if available) */
  cleanedTranscript?: string | null;
  /** Duration in seconds */
  durationSeconds?: number | null;
  /** Whether recording is loading */
  isLoadingRecording?: boolean;
  /** Actions taken array */
  actionsTaken?: (string | { action: string; details?: string })[];
  /** Whether the call was successful */
  isSuccessful?: boolean;
  /** Default active tab */
  defaultTab?: "summary" | "actions";
  /** Additional className */
  className?: string;
}

/**
 * Call Detail Tabs
 *
 * Tabbed panel for call details with Summary and Actions tabs.
 * Replaces the old CallDetailContent component with a tabbed interface.
 */
export function CallDetailTabs({
  summary,
  recordingUrl,
  transcript: _transcript,
  cleanedTranscript: _cleanedTranscript,
  durationSeconds,
  isLoadingRecording: _isLoadingRecording,
  actionsTaken,
  isSuccessful,
  defaultTab = "summary",
  className,
}: CallDetailTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className={cn("flex flex-col", className)}>
      {/* Tab triggers */}
      <TabsList className="mb-4 w-full justify-start bg-slate-100/80 dark:bg-slate-800/80">
        <TabsTrigger
          value="summary"
          className={cn(
            "flex items-center gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700",
            "data-[state=active]:shadow-sm",
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Summary</span>
        </TabsTrigger>
        <TabsTrigger
          value="actions"
          className={cn(
            "flex items-center gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700",
            "data-[state=active]:shadow-sm",
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Actions</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab content */}
      <TabsContent value="summary" className="mt-0">
        <SummaryTab
          summary={summary}
          recordingUrl={recordingUrl}
          durationSeconds={durationSeconds}
          actionsTaken={actionsTaken}
          isSuccessful={isSuccessful}
        />
      </TabsContent>

      <TabsContent value="actions" className="mt-0">
        <ActionsTab />
      </TabsContent>
    </Tabs>
  );
}
