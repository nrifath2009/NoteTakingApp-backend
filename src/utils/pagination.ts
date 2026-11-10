import { z } from "zod";

function intQuery(defaultValue: number, max?: number) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === "") return String(defaultValue);
      if (typeof value !== "string") return value;
      return value.trim();
    },
    z
      .string()
      .regex(/^\d+$/, "Must be a positive integer")
      .transform(Number)
      .refine((value) => value >= 1, "Must be at least 1")
      .refine((value) => max === undefined || value <= max, `Must be at most ${max ?? ""}`),
  );
}

export const paginationQuerySchema = z.object({
  page: intQuery(1),
  limit: intQuery(10, 100),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export const LIST_SORT = { createdAt: -1 as const, _id: -1 as const };
