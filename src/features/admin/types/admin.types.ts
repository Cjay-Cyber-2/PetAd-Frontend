import type { z } from "zod";
import type {
  adminStatsSchema,
  adminUserSchema,
  auditLogEntrySchema,
} from "../schemas/adminSchemas";

// Types are inferred from the Zod schemas so the two can never drift apart.

export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserStatus = AdminUser["status"];
export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type AdminStats = z.infer<typeof adminStatsSchema>;

export type { Paginated } from "../schemas/paginated";

export interface AdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  actorId?: string;
  action?: string;
  entityType?: string;
  /** ISO date lower bound (inclusive). */
  from?: string;
  /** ISO date upper bound (inclusive). */
  to?: string;
}
