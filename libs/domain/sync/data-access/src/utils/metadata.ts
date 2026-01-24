/**
 * Metadata Type Casting Utilities
 * Helpers for safe metadata type casting with Supabase
 */

import type { Database } from "@odis-ai/shared/types";

type CaseInsertMetadata =
  Database["public"]["Tables"]["cases"]["Insert"]["metadata"];
type CaseUpdateMetadata =
  Database["public"]["Tables"]["cases"]["Update"]["metadata"];

/**
 * Cast metadata for case insert operations
 * Handles the `as unknown as` pattern needed for Supabase JSON columns
 */
export function asCaseInsertMetadata(
  metadata: Record<string, unknown>,
): CaseInsertMetadata {
  return metadata as unknown as CaseInsertMetadata;
}

/**
 * Cast metadata for case update operations
 * Handles the `as unknown as` pattern needed for Supabase JSON columns
 */
export function asCaseUpdateMetadata(
  metadata: Record<string, unknown>,
): CaseUpdateMetadata {
  return metadata as unknown as CaseUpdateMetadata;
}

/**
 * Safely extract metadata as a record for reading
 */
export function extractMetadataRecord(
  metadata: unknown,
): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}
