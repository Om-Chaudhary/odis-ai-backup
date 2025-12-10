/**
 * Cases Router Schemas
 *
 * Validation schemas for case operations.
 */

import { z } from "zod";

export const caseSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  visibility: z.enum(["public", "private"]).nullable().optional(),
  type: z
    .enum(["checkup", "emergency", "surgery", "follow_up"])
    .nullable()
    .optional(),
  status: z
    .enum(["draft", "ongoing", "completed", "reviewed"])
    .nullable()
    .optional(),
  scheduled_at: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  external_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});
