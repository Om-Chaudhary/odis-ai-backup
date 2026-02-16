/**
 * Services Index
 *
 * Export all services from a single entry point.
 */

export { PersistenceService } from "./persistence.service";
export { createProviderForClinic } from "./provider-factory.service";
export type {
  ProviderFactoryOptions,
  ProviderFactoryResult,
} from "./provider-factory.service";
export { SessionCacheService } from "./session-cache.service";
export type { CachedSession } from "./session-cache.service";
export { executeAppointmentSync } from "./appointment-sync.service";
export type {
  AppointmentSyncOptions,
  AppointmentSyncResult,
} from "./appointment-sync.service";
