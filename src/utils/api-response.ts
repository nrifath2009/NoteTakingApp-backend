export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function success<T>(data: T) {
  return { success: true as const, data };
}

export function successList<T>(data: T[], pagination: PaginationMeta) {
  return { success: true as const, data, pagination };
}
