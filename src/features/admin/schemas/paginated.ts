import { z } from "zod";

/**
 * Builds the schema for a paginated admin list: `{ items, total, page, pageSize }`.
 *
 * One factory serves every admin list (users, audit log, …) so the envelope is
 * validated the same way everywhere.
 *
 * @example
 * const usersPageSchema = paginatedSchema(adminUserSchema);
 * type UsersPage = z.infer<typeof usersPageSchema>;
 */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

/** The inferred `Paginated<T>` envelope. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
