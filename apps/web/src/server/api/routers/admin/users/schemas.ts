import { z } from "zod";

export const listUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["all", "admin", "staff", "viewer"]).optional(),
  clinicId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const getUserByIdSchema = z.object({
  userId: z.string().uuid(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["admin", "staff", "viewer"]).default("staff"),
  clinicId: z.string().uuid(),
  clinicRole: z.enum(["owner", "admin", "member"]).default("member"),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "staff", "viewer"]),
});

export const grantClinicAccessSchema = z.object({
  userId: z.string().uuid(),
  clinicId: z.string().uuid(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const revokeClinicAccessSchema = z.object({
  userId: z.string().uuid(),
  clinicId: z.string().uuid(),
});

export const deactivateUserSchema = z.object({
  userId: z.string().uuid(),
});

export const getUserActivitySchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(50).default(10),
});
