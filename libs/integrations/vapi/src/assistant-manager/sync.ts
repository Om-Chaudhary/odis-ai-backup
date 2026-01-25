/**
 * Assistant Sync Operations
 *
 * Functions for loading assistant configs and syncing to VAPI.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getVapiClient } from "../client/utils";
import type {
  AssistantConfig,
  AssistantMappingRow,
  SyncOptions,
  SyncResult,
  SyncChange,
} from "./types";

/**
 * Sync a single assistant to VAPI
 *
 * Compares current VAPI state with desired config and applies changes.
 */
export async function syncAssistant(
  config: AssistantConfig,
  options: SyncOptions,
): Promise<SyncResult> {
  const vapi = getVapiClient();
  const changes: SyncChange[] = [];

  try {
    // Get current VAPI state
    const current = await vapi.assistants.get(config.id);

    // Extract current system prompt from messages
    const currentMessages = current.model?.messages as
      | Array<{ role: string; content: string }>
      | undefined;
    const currentPrompt = currentMessages?.find(
      (m) => m.role === "system",
    )?.content;

    // Calculate prompt changes
    if (!options.toolsOnly && config.systemPrompt) {
      if (currentPrompt !== config.systemPrompt) {
        changes.push({
          field: "systemPrompt",
          oldValue: currentPrompt
            ? `${currentPrompt.substring(0, 100)}...`
            : "(empty)",
          newValue: `${config.systemPrompt.substring(0, 100)}...`,
          action: "update",
        });
      }
    }

    // Calculate tool changes
    if (!options.promptsOnly && config.toolIds) {
      const modelToolIds = current.model?.toolIds;
      const currentToolIds: string[] = Array.isArray(modelToolIds)
        ? modelToolIds
        : [];
      const addedTools = config.toolIds.filter(
        (id) => !currentToolIds.includes(id),
      );
      const removedTools = currentToolIds.filter(
        (id) => !config.toolIds!.includes(id),
      );

      for (const toolId of addedTools) {
        changes.push({
          field: "toolIds",
          newValue: toolId,
          action: "add",
        });
      }

      for (const toolId of removedTools) {
        changes.push({
          field: "toolIds",
          oldValue: toolId,
          action: "remove",
        });
      }
    }

    // Apply changes if not dry run
    if (!options.dryRun && changes.length > 0) {
      const updatePayload: Record<string, unknown> = {};

      if (config.systemPrompt && !options.toolsOnly) {
        // Preserve existing model config, update messages
        const existingModel = current.model ?? {};
        updatePayload.model = {
          ...existingModel,
          messages: [{ role: "system", content: config.systemPrompt }],
        };
      }

      if (config.toolIds && !options.promptsOnly) {
        // Add toolIds to model config
        const modelWithTools = (updatePayload.model ?? current.model ?? {}) as Record<string, unknown>;
        updatePayload.model = {
          ...modelWithTools,
          toolIds: config.toolIds,
        };
      }

      if (Object.keys(updatePayload).length > 0) {
        await vapi.assistants.update(config.id, updatePayload);
      }
    }

    return {
      assistantId: config.id,
      clinicSlug: config.clinicSlug,
      assistantType: config.assistantType,
      changes,
      success: true,
    };
  } catch (error) {
    return {
      assistantId: config.id,
      clinicSlug: config.clinicSlug,
      assistantType: config.assistantType,
      changes,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Load assistant configs from database
 *
 * Queries vapi_assistant_mappings joined with clinics.
 */
export async function loadAssistantConfigs(
  supabase: SupabaseClient,
  options: SyncOptions,
): Promise<AssistantConfig[]> {
  let query = supabase
    .from("vapi_assistant_mappings")
    .select(
      `
      id,
      assistant_id,
      assistant_name,
      assistant_type,
      environment,
      is_active,
      prompt_version,
      last_synced_at,
      sync_status,
      clinic:clinics (
        id,
        name,
        slug,
        timezone,
        business_hours,
        custom_prompts
      )
    `,
    )
    .eq("is_active", true)
    .eq("environment", "production");

  if (options.assistantType) {
    query = query.eq("assistant_type", options.assistantType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load assistant configs: ${error.message}`);
  }

  // Filter by clinic slug if specified (can't do in query due to join)
  let rows = (data ?? []) as unknown as AssistantMappingRow[];

  if (options.clinicSlug) {
    rows = rows.filter((row) => row.clinic?.slug === options.clinicSlug);
  }

  return rows.map((row) => ({
    id: row.assistant_id,
    name: row.assistant_name ?? `${row.clinic.name} - ${row.assistant_type}`,
    clinicId: row.clinic.id,
    clinicSlug: row.clinic.slug,
    assistantType: row.assistant_type as "inbound" | "outbound",
    environment: row.environment as "production" | "development",
    promptVersion: row.prompt_version ?? undefined,
    lastSyncedAt: row.last_synced_at
      ? new Date(row.last_synced_at)
      : undefined,
    syncStatus: (row.sync_status as AssistantConfig["syncStatus"]) ?? "unknown",
  }));
}

/**
 * Update sync status in database after sync
 */
export async function updateSyncStatus(
  supabase: SupabaseClient,
  assistantId: string,
  status: "synced" | "error",
  promptVersion?: string,
): Promise<void> {
  const { error } = await supabase
    .from("vapi_assistant_mappings")
    .update({
      sync_status: status,
      last_synced_at: new Date().toISOString(),
      ...(promptVersion && { prompt_version: promptVersion }),
    })
    .eq("assistant_id", assistantId);

  if (error) {
    console.warn(`Failed to update sync status for ${assistantId}:`, error);
  }
}
