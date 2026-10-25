import { apiClient } from "../lib/api-client";
import { ApiError, ForbiddenError } from "../lib/api-errors";
import {
  adminStatsSchema,
  adminUsersPageSchema,
  auditLogPageSchema,
} from "../features/admin/schemas/adminSchemas";
import type {
  AdminStats,
  AdminUsersParams,
  AuditLogParams,
  Paginated,
  AdminUser,
  AuditLogEntry,
} from "../features/admin/types/admin.types";

/**
 * Maps 403 → `ForbiddenError` so callers (and the global handler in
 * `lib/query-client`) can branch with `instanceof` instead of status codes.
 */
async function withAdminErrors<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      throw new ForbiddenError(error.message, {
        status: 403,
        code: error.code ?? "ADMIN_FORBIDDEN",
        data: error.data,
      });
    }
    throw error;
  }
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/**
 * `adminService` — API layer for the Admin & Moderation console.
 *
 * Every response is parsed through the Zod schemas in `features/admin/schemas`,
 * so contract drift fails at the boundary instead of deep inside a table.
 *
 * @see https://github.com/amina69/PetAd-Frontend/issues/709
 */
export const adminService = {
  /** GET /admin/users — paginated user list. */
  async listUsers(params: AdminUsersParams = {}): Promise<Paginated<AdminUser>> {
    const response = await withAdminErrors(() =>
      apiClient.get<unknown>(`/admin/users${toQuery(params)}`),
    );
    return adminUsersPageSchema.parse(response);
  },

  /** GET /admin/audit-log — paginated, filterable audit log. */
  async getAuditLog(params: AuditLogParams = {}): Promise<Paginated<AuditLogEntry>> {
    const response = await withAdminErrors(() =>
      apiClient.get<unknown>(`/admin/audit-log${toQuery(params)}`),
    );
    return auditLogPageSchema.parse(response);
  },

  /** GET /admin/stats — headline counts for the console. */
  async getStats(): Promise<AdminStats> {
    const response = await withAdminErrors(() =>
      apiClient.get<unknown>("/admin/stats"),
    );
    return adminStatsSchema.parse(response);
  },
};
