/**
 * Re-export OutboundDashboard from the shared outbound components.
 *
 * This allows the clinic-scoped route to use the same component
 * that is used by the legacy route while gradually migrating.
 */
export { OutboundDashboard } from "~/components/dashboard/outbound";
