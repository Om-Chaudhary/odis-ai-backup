"use client";

import { Phone, FileText } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@odis-ai/shared/ui/tabs";
import { SummaryTab } from "./summary-tab";
import { CallTab } from "~/components/dashboard/inbound/detail/call-tab";

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
  /** Actions taken array (passed to Summary tab but not displayed there anymore) */
  actionsTaken?: (string | { action: string; details?: string })[];
  /** Whether the call was successful */
  isSuccessful?: boolean;
  /** Default active tab */
  defaultTab?: "call" | "summary";
  /** Additional className */
  className?: string;
}

/**
 * Call Detail Tabs - Redesigned
 *
 * New tabbed layout prioritizing call content:
 * - Call tab (default): Audio player + scrollable transcript
 * - Summary tab: Call summary text only
 *
 * Features refined, clinical-yet-warm aesthetic with IBM Plex Sans typography.
 */
export function CallDetailTabs({
  summary,
  recordingUrl,
  transcript,
  cleanedTranscript,
  durationSeconds,
  isLoadingRecording,
  actionsTaken: _actionsTaken, // Not used anymore (shown in action cards)
  isSuccessful: _isSuccessful,
  defaultTab = "call",
  className,
}: CallDetailTabsProps) {
  return (
    <Tabs
      defaultValue={defaultTab}
      className={cn("flex flex-col", className)}
      style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
    >
      {/* Tab triggers - Refined styling */}
      <TabsList
        className={cn(
          "mb-4 w-full justify-start gap-1 bg-slate-100/60 p-1",
          "dark:bg-slate-800/60",
          "ring-1 ring-slate-200/40 dark:ring-slate-700/40",
        )}
      >
        <TabsTrigger
          value="call"
          className={cn(
            "flex items-center gap-2 px-4 py-2",
            "text-sm font-medium tracking-tight",
            "rounded-lg transition-all duration-200",
            "text-slate-600 hover:text-slate-900",
            "dark:text-slate-400 dark:hover:text-slate-100",
            "data-[state=active]:bg-white data-[state=active]:text-slate-900",
            "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/60",
            "dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100",
            "dark:data-[state=active]:ring-slate-600/60",
          )}
        >
          <Phone className="h-4 w-4" strokeWidth={2} />
          <span>Call</span>
        </TabsTrigger>
        <TabsTrigger
          value="summary"
          className={cn(
            "flex items-center gap-2 px-4 py-2",
            "text-sm font-medium tracking-tight",
            "rounded-lg transition-all duration-200",
            "text-slate-600 hover:text-slate-900",
            "dark:text-slate-400 dark:hover:text-slate-100",
            "data-[state=active]:bg-white data-[state=active]:text-slate-900",
            "data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/60",
            "dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100",
            "dark:data-[state=active]:ring-slate-600/60",
          )}
        >
          <FileText className="h-4 w-4" strokeWidth={2} />
          <span>Summary</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab content */}
      <TabsContent value="call" className="mt-0 flex-1">
        <CallTab
          recordingUrl={recordingUrl}
          transcript={transcript}
          cleanedTranscript={cleanedTranscript}
          durationSeconds={durationSeconds}
          isLoadingRecording={isLoadingRecording}
        />
      </TabsContent>

      <TabsContent value="summary" className="mt-0">
        <SummaryTab summary={summary} />
      </TabsContent>
    </Tabs>
  );
}
