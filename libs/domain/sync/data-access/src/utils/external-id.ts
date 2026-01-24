/**
 * External ID Utilities
 * Builds consistent external IDs for PIMS appointments
 */

/**
 * Normalize provider name for use in external ID
 */
function normalizeProviderName(providerName: string): string {
  return providerName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Build external ID for a PIMS appointment
 * Format: pims-appt-{provider-name}-{appointment-id}
 */
export function buildPimsExternalId(
  providerName: string,
  appointmentId: string,
): string {
  return `pims-appt-${normalizeProviderName(providerName)}-${appointmentId}`;
}

/**
 * Build source string for a PIMS-synced case
 * Format: pims:{provider-name}
 */
export function buildPimsSource(providerName: string): string {
  return `pims:${normalizeProviderName(providerName)}`;
}
