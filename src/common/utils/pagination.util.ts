import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../dto/pagination-query.dto';

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function resolvePaginationParams(
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
): PaginationParams {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, limit));

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}
