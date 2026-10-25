import { describe, expect, it } from "vitest";
import { z } from "zod";
import { paginatedSchema } from "../schemas/paginated";
import { adminUsersPageSchema, auditLogPageSchema } from "../schemas/adminSchemas";

describe("paginatedSchema", () => {
  const numbers = paginatedSchema(z.number());

  it("accepts a valid envelope", () => {
    const page = { items: [1, 2], total: 2, page: 1, pageSize: 20 };
    expect(numbers.parse(page)).toEqual(page);
  });

  it("is reusable for different item schemas", () => {
    const strings = paginatedSchema(z.string());
    expect(strings.safeParse({ items: ["a"], total: 1, page: 1, pageSize: 1 }).success).toBe(true);
    expect(numbers.safeParse({ items: ["a"], total: 1, page: 1, pageSize: 1 }).success).toBe(false);
  });

  it.each([
    ["negative total", { items: [], total: -1, page: 1, pageSize: 20 }],
    ["zero page", { items: [], total: 0, page: 0, pageSize: 20 }],
    ["zero pageSize", { items: [], total: 0, page: 1, pageSize: 0 }],
    ["fractional page", { items: [], total: 0, page: 1.5, pageSize: 20 }],
    ["missing items", { total: 0, page: 1, pageSize: 20 }],
  ])("rejects %s", (_label, value) => {
    expect(numbers.safeParse(value).success).toBe(false);
  });

  it("backs both admin lists", () => {
    const empty = { items: [], total: 0, page: 1, pageSize: 20 };
    expect(adminUsersPageSchema.safeParse(empty).success).toBe(true);
    expect(auditLogPageSchema.safeParse(empty).success).toBe(true);
  });
});
