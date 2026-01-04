/**
 * Outbound Discharge Call Manager Components
 *
 * Architecture:
 * - Full-screen compact layout with pagination
 * - Split-view (react-resizable-panels): table + detail panel
 * - View modes: All Discharges / Needs Review (inline edit)
 * - Status filters: All, Ready to Send, Scheduled, Sent, Failed
 */

// Main client component
export { OutboundDashboard } from "./outbound-dashboard";

// Layout components
export { OutboundSplitLayout } from "./outbound-split-layout";

// Table components
export { OutboundCaseTable } from "./outbound-case-table";
export { OutboundNeedsReviewTable } from "./outbound-needs-review-table";
export { OutboundBulkActionBar } from "./outbound-bulk-action-bar";

// Pagination
export { OutboundPagination } from "./outbound-pagination";

// Detail panel
export { OutboundCaseDetail } from "./outbound-case-detail";
export * from "./detail";

// Analytics widgets
export * from "./analytics";

// Error handling
export { OutboundErrorBoundary } from "./outbound-error-boundary";

// Empty state
export { OutboundEmptyState } from "./outbound-empty-state";

// Alert banner
export { OutboundMissingContactsBanner } from "./outbound-missing-contacts-banner";

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
  // Filter types
  ViewMode,
  StatusFilter,
  PaginationState,
  // Entity types
  Patient,
  Owner,
  StructuredDischargeContent,
  DischargeSummary,
  ScheduledCall,
  ScheduledEmail,
  DischargeCase,
  DischargeBatch,
  SoapNote,
  // Stats & settings
  DischargeSummaryStats,
  UserDischargeSettings,
  FailureCategoryCounts,
  // UI state
  OutboundFiltersState,
  PanelConfig,
  PreviewTab,
  DeliveryToggles,
} from "./types";

// Mock data (development only)
export { mockDischargeCases, mockStats, generateMockCases } from "./mock-data";
