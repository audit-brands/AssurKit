export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationMetadata
}

export const DEFAULT_PAGE_SIZE = 25

export const normalizePage = (page?: number) => (page && page > 0 ? page : 1)
export const normalizeLimit = (limit?: number, defaultLimit = DEFAULT_PAGE_SIZE) => (limit && limit > 0 ? limit : defaultLimit)
