import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { ZodError } from "zod";
import { server } from "../../mocks/server";
import { ApiError, ForbiddenError } from "../../lib/api-errors";
import { adminService } from "../adminService";

const user = {
  id: "u1",
  name: "Ada",
  email: "ada@example.com",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-01-01T00:00:00Z",
};

const entry = {
  id: "a1",
  actorId: "u9",
  actorName: "Admin",
  action: "USER_SUSPENDED",
  entityType: "user",
  entityId: "u1",
  createdAt: "2026-01-02T00:00:00Z",
  metadata: { reason: "spam" },
};

describe("adminService", () => {
  describe("listUsers", () => {
    it("sends paging/search params and parses the envelope", async () => {
      let search = "";
      server.use(
        http.get("*/api/admin/users", ({ request }) => {
          search = new URL(request.url).search;
          return HttpResponse.json({ items: [user], total: 1, page: 2, pageSize: 10 });
        }),
      );

      const result = await adminService.listUsers({ page: 2, pageSize: 10, search: "ada" });

      expect(result).toEqual({ items: [user], total: 1, page: 2, pageSize: 10 });
      expect(search).toBe("?page=2&pageSize=10&search=ada");
    });

    it("omits empty params", async () => {
      let search = "x";
      server.use(
        http.get("*/api/admin/users", ({ request }) => {
          search = new URL(request.url).search;
          return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 });
        }),
      );

      await adminService.listUsers({ search: "" });
      expect(search).toBe("");
    });

    it("rejects a response that breaks the contract", async () => {
      server.use(
        http.get("*/api/admin/users", () =>
          HttpResponse.json({ items: [{ ...user, role: "SUPERUSER" }], total: 1, page: 1, pageSize: 20 }),
        ),
      );

      await expect(adminService.listUsers()).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe("getAuditLog", () => {
    it("sends filters and parses entries", async () => {
      let search = "";
      server.use(
        http.get("*/api/admin/audit-log", ({ request }) => {
          search = new URL(request.url).search;
          return HttpResponse.json({ items: [entry], total: 1, page: 1, pageSize: 20 });
        }),
      );

      const result = await adminService.getAuditLog({ actorId: "u9", action: "USER_SUSPENDED", from: "2026-01-01" });

      expect(result.items[0]).toEqual(entry);
      expect(search).toBe("?actorId=u9&action=USER_SUSPENDED&from=2026-01-01");
    });

    it("requires entityType and entityId on every entry", async () => {
      const { entityId: _omit, ...broken } = entry;
      void _omit;
      server.use(
        http.get("*/api/admin/audit-log", () =>
          HttpResponse.json({ items: [broken], total: 1, page: 1, pageSize: 20 }),
        ),
      );

      await expect(adminService.getAuditLog()).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe("getStats", () => {
    it("parses the counts", async () => {
      const stats = { totalUsers: 10, activeUsers: 8, suspendedUsers: 2, openDisputes: 1, pendingDocuments: 4 };
      server.use(http.get("*/api/admin/stats", () => HttpResponse.json(stats)));

      await expect(adminService.getStats()).resolves.toEqual(stats);
    });
  });

  describe("errors", () => {
    it.each([
      ["listUsers", () => adminService.listUsers(), "*/api/admin/users"],
      ["getAuditLog", () => adminService.getAuditLog(), "*/api/admin/audit-log"],
      ["getStats", () => adminService.getStats(), "*/api/admin/stats"],
    ])("%s maps 403 to ForbiddenError", async (_name, call, path) => {
      server.use(http.get(path, () => HttpResponse.json({ message: "Admins only" }, { status: 403 })));

      const error = await call().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).status).toBe(403);
      expect((error as ForbiddenError).code).toBe("ADMIN_FORBIDDEN");
    });

    it("passes other API errors through unchanged", async () => {
      server.use(http.get("*/api/admin/stats", () => HttpResponse.json({}, { status: 500 })));

      const error = await adminService.getStats().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).not.toBeInstanceOf(ForbiddenError);
    });
  });
});
