export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(
  pageVal?: any,
  limitVal?: any,
  defaultLimit: number = 10,
  maxLimit: number = 100,
): PaginationParams {
  let page = parseInt(pageVal, 10);
  if (isNaN(page) || page <= 0) {
    page = 1;
  }

  let limit = parseInt(limitVal, 10);
  if (isNaN(limit) || limit <= 0) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}
