import type { BatchEligibleCase } from "@odis-ai/shared/types";

export type DateFilter = "today" | "yesterday" | "day-2" | "day-3" | "day-4";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

export interface ProcessingResult {
  id: string;
  patientName: string;
  status: ProcessingStatus;
  error?: string;
}

export type Step = "select" | "schedule" | "review" | "processing" | "complete";

export type ScheduleMode = "datetime" | "minutes";

export interface BatchState {
  currentStep: Step;
  selectedCases: Set<string>;
  emailScheduleTime: Date | null;
  callScheduleTime: Date | null;
  emailScheduleMode: ScheduleMode;
  callScheduleMode: ScheduleMode;
  emailMinutesFromNow: number;
  callMinutesFromNow: number;
  emailsEnabled: boolean;
  callsEnabled: boolean;
  skippedCases: Set<string>;
  processingResults: Map<string, ProcessingStatus>;
  processingErrors: Map<string, string>;
  finalResults: ProcessingResult[];
  isProcessing: boolean;
  activeBatchId: string | null;
}

export interface BatchCaseWithStatus extends BatchEligibleCase {
  isSelectable: boolean;
  isSkipped: boolean;
}

export interface TimeOption {
  value: string;
  label: string;
}
