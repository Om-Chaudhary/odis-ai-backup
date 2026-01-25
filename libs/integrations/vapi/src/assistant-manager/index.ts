/**
 * VAPI Assistant Manager
 *
 * Programmatic management of VAPI assistants.
 *
 * @module vapi/assistant-manager
 */

export type {
  AssistantConfig,
  SyncOptions,
  SyncResult,
  SyncChange,
  AssistantMappingRow,
} from "./types";

export {
  syncAssistant,
  loadAssistantConfigs,
  updateSyncStatus,
} from "./sync";
