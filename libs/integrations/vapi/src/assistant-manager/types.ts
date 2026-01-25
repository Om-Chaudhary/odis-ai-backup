/**
 * Assistant Manager Types
 *
 * Type definitions for assistant configuration and sync operations.
 */

export interface AssistantConfig {
  /** VAPI assistant ID */
  id: string;
  /** Assistant display name */
  name: string;
  /** Associated clinic ID */
  clinicId: string;
  /** Clinic slug for logging */
  clinicSlug: string;
  /** Assistant type */
  assistantType: "inbound" | "outbound";
  /** Environment (prod/dev) */
  environment: "production" | "development";

  // VAPI configuration
  /** System prompt content */
  systemPrompt?: string;
  /** Tool IDs to bind */
  toolIds?: string[];
  /** Voice configuration */
  voiceConfig?: {
    provider: string;
    voiceId: string;
    model?: string;
  };
  /** LLM configuration */
  modelConfig?: {
    provider: string;
    model: string;
  };

  // Sync tracking
  /** Version identifier for the prompt template */
  promptVersion?: string;
  /** Last sync timestamp */
  lastSyncedAt?: Date;
  /** Current sync status */
  syncStatus?: "synced" | "pending" | "error" | "unknown";
}

export interface SyncOptions {
  /** Show changes without applying */
  dryRun: boolean;
  /** Filter by clinic slug */
  clinicSlug?: string;
  /** Filter by assistant type */
  assistantType?: "inbound" | "outbound";
  /** Only sync tool bindings */
  toolsOnly?: boolean;
  /** Only sync system prompts */
  promptsOnly?: boolean;
}

export interface SyncResult {
  /** VAPI assistant ID */
  assistantId: string;
  /** Clinic slug */
  clinicSlug: string;
  /** Assistant type */
  assistantType: string;
  /** List of changes made or detected */
  changes: SyncChange[];
  /** Whether sync succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

export interface SyncChange {
  /** Field that changed */
  field: string;
  /** Previous value (for display) */
  oldValue?: unknown;
  /** New value (for display) */
  newValue?: unknown;
  /** Type of change */
  action: "update" | "add" | "remove";
}

/**
 * Database row from vapi_assistant_mappings join
 */
export interface AssistantMappingRow {
  id: string;
  assistant_id: string;
  assistant_name: string | null;
  assistant_type: string;
  environment: string;
  is_active: boolean;
  prompt_version: string | null;
  last_synced_at: string | null;
  sync_status: string | null;
  clinic: {
    id: string;
    name: string;
    slug: string;
    timezone: string | null;
    business_hours: Record<string, unknown> | null;
    custom_prompts: Record<string, string> | null;
  };
}
