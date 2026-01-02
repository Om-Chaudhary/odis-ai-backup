// Existing badge components
export * from "./attention-badges";
export * from "./status-badges";

// Re-export badge components from inbound/detail for consistency
export { CallStatusBadge } from "../../inbound/detail/badges/call-status-badge";
export { SentimentBadge } from "../../inbound/detail/badges/sentiment-badge";
export { AppointmentStatusBadge } from "../../inbound/detail/badges/appointment-status-badge";
