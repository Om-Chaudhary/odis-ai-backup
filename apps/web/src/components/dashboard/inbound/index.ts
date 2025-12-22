/**
 * Inbound Dashboard Components
 *
 * Exports for the redesigned inbound dashboard with tab-based views
 * for calls, appointment requests, and messages.
 * View mode switching is now in the sidebar navigation.
 */

// Main components
export { InboundClient } from "./inbound-client";
export { InboundSplitLayout } from "./inbound-split-layout";
export { InboundPagination } from "./inbound-pagination";

// Table module
export { InboundTable } from "./table";
export * from "./table";

// Detail module
export { InboundDetail } from "./inbound-detail-refactored";
export * from "./detail";

// Demo data
export * from "./demo-data";

// Types
export * from "./types";
