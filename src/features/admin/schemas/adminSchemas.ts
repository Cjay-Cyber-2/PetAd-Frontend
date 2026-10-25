import { z } from "zod";
import { paginatedSchema } from "./paginated";

export const ADMIN_USER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["ADMIN", "SHELTER", "USER"]),
  status: z.enum(ADMIN_USER_STATUSES),
  createdAt: z.string(),
});

export const auditLogEntrySchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()),
});

export const adminStatsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  suspendedUsers: z.number().int().nonnegative(),
  openDisputes: z.number().int().nonnegative(),
  pendingDocuments: z.number().int().nonnegative(),
});

export const adminUsersPageSchema = paginatedSchema(adminUserSchema);
export const auditLogPageSchema = paginatedSchema(auditLogEntrySchema);

/** Query params accepted by the paginated admin lists. */
export const adminListParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});
