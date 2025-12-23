/**
 * Admin Router Schemas
 *
 * Zod schemas for admin procedure inputs and outputs.
 */

import { z } from "zod";

// ============================================================================
// Pagination & Sorting
// ============================================================================

export const paginationInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(50),
});

export const sortInput = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// User Schemas
// ============================================================================

export const userRoleEnum = z.enum([
  "admin",
  "veterinarian",
  "vet_tech",
  "practice_owner",
  "client",
]);

export const listUsersInput = paginationInput.extend({
  search: z.string().optional(),
  role: userRoleEnum.optional(),
  clinicName: z.string().optional(),
  sortBy: z
    .enum(["created_at", "email", "clinic_name", "role", "last_sign_in_at"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getUserInput = z.object({
  userId: z.string().uuid(),
});

export const updateUserInput = z.object({
  userId: z.string().uuid(),
  updates: z.object({
    role: userRoleEnum.optional(),
    testModeEnabled: z.boolean().optional(),
    clinicName: z.string().optional(),
  }),
});

// ============================================================================
// Case Schemas
// ============================================================================

export const caseStatusEnum = z.enum([
  "draft",
  "ongoing",
  "completed",
  "reviewed",
]);

export const listAllCasesInput = paginationInput.extend({
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  status: caseStatusEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum(["created_at", "scheduled_at", "status", "type"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getCaseInput = z.object({
  caseId: z.string().uuid(),
});

export const bulkUpdateCasesInput = z.object({
  caseIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: caseStatusEnum.optional(),
    isStarred: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
  }),
});

export const bulkDeleteCasesInput = z.object({
  caseIds: z.array(z.string().uuid()).min(1).max(100),
});

// ============================================================================
// Discharge Schemas
// ============================================================================

export const dischargeStatusEnum = z.enum([
  "queued",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
  "sent",
]);

export const listScheduledCallsInput = paginationInput.extend({
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  status: dischargeStatusEnum.optional(),
  hasAttention: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum(["created_at", "scheduled_for", "status", "started_at"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const listScheduledEmailsInput = paginationInput.extend({
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  status: dischargeStatusEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum(["created_at", "scheduled_for", "status", "sent_at"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const bulkCancelDischargesInput = z.object({
  callIds: z.array(z.string().uuid()).optional(),
  emailIds: z.array(z.string().uuid()).optional(),
});

export const bulkRescheduleInput = z.object({
  callIds: z.array(z.string().uuid()).optional(),
  emailIds: z.array(z.string().uuid()).optional(),
  scheduledFor: z.string().datetime(),
});

// ============================================================================
// Admin Stats Schemas
// ============================================================================

export const getAdminStatsInput = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .optional();

// ============================================================================
// Type Exports
// ============================================================================

export type UserRole = z.infer<typeof userRoleEnum>;
export type CaseStatus = z.infer<typeof caseStatusEnum>;
export type DischargeStatus = z.infer<typeof dischargeStatusEnum>;

export type ListUsersInput = z.infer<typeof listUsersInput>;
export type ListAllCasesInput = z.infer<typeof listAllCasesInput>;
export type ListScheduledCallsInput = z.infer<typeof listScheduledCallsInput>;
export type ListScheduledEmailsInput = z.infer<typeof listScheduledEmailsInput>;
