/**
 * Clinic-Scoped Outbound Components
 *
 * Re-exports from the shared outbound components directory.
 * This allows the clinic-scoped route to use the same components
 * while supporting clinic context.
 */

export { OutboundDashboard } from "./outbound-dashboard";
export { OutboundErrorBoundary } from "./outbound-error-boundary";

// Re-export additional types and components from shared location
export * from "~/app/dashboard/outbound/_components";
