/**
 * Outbound Discharge Call Manager Components
 *
 * Architecture:
 * - Split-view layout (react-resizable-panels)
 * - Left panel: Full-width case queue table with filters
 * - Right panel: Case detail (slides in on selection)
 *
 * Data sources:
 * - cases + patients (case & patient info)
 * - discharge_summaries (AI content)
 * - scheduled_discharge_calls (VAPI calls)
 * - scheduled_discharge_emails (Resend emails)
 */

// Main client component
export { OutboundDischargesClient } from "./outbound-discharges-client";

// Layout components
export { OutboundSplitLayout } from "./outbound-split-layout";

// Filters
export { OutboundFilterTabs } from "./outbound-filter-tabs";

// Table components
export { OutboundCaseTable } from "./outbound-case-table";

// Detail panel
export { OutboundCaseDetail } from "./outbound-case-detail";

// Error handling
export { OutboundErrorBoundary } from "./outbound-error-boundary";

// Empty state
export { OutboundEmptyState } from "./outbound-empty-state";

// Skeletons
export {
  FilterTabsSkeleton,
  CaseTableSkeleton,
  CaseDetailSkeleton,
  OutboundPageSkeleton,
} from "./outbound-skeletons";

// Types - Core entities
export type {
  // Status types
  CallStatus,
  EmailStatus,
  ReviewCategory,
  CaseStatus,
  CaseType,
  DischargeCaseStatus,
  DeliveryStatus,
  BatchStatus,
  BatchItemStatus,
  // Entity types
  Patient,
  Owner,
  StructuredDischargeContent,
  DischargeSummary,
  ScheduledCall,
  ScheduledEmail,
  DischargeCase,
  DischargeBatch,
  // Stats & settings
  DischargeSummaryStats,
  UserDischargeSettings,
  // UI state
  OutboundFiltersState,
  PanelConfig,
  PreviewTab,
  DeliveryToggles,
} from "./types";

// Mock data (development only)
export { mockDischargeCases, mockStats, generateMockCases } from "./mock-data";
