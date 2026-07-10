/**
 * Universal data layer: pagination, filtering, sorting over localStorage.
 * Designed to be swapped for an API layer without changing call sites.
 */

export type SortDir = 'asc' | 'desc'

export type SortConfig<T> = {
  key: keyof T
  dir: SortDir
}

export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | undefined

export type FilterConfig = Record<string, FilterValue>

export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type QueryConfig<T> = {
  page?: number
  pageSize?: number
  sort?: SortConfig<T>
  filters?: FilterConfig
  search?: string
  searchKeys?: (keyof T)[]
}

/** Core query function: filter -> search -> sort -> paginate */
export function queryItems<T extends object>(
  items: T[],
  config: QueryConfig<T> = {},
): PageResult<T> {
  const {
    page = 1,
    pageSize = 20,
    sort,
    filters = {},
    search = '',
    searchKeys = [],
  } = config

  let result = [...items]

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || value === null) continue

    if (Array.isArray(value)) {
      if (value.length === 0) continue
      result = result.filter((item) => {
        const itemValue = (item as Record<string, unknown>)[key]
        return value.some((candidate) => String(candidate) === String(itemValue ?? ''))
      })
      continue
    }

    if (typeof value === 'boolean') {
      result = result.filter(
        (item) => Boolean((item as Record<string, unknown>)[key]) === value,
      )
      continue
    }

    result = result.filter(
      (item) =>
        String((item as Record<string, unknown>)[key] ?? '').toLowerCase() ===
        String(value).toLowerCase(),
    )
  }

  if (search.trim() && searchKeys.length > 0) {
    const normalized = search.trim().toLowerCase()
    result = result.filter((item) =>
      searchKeys.some((key) =>
        String((item as Record<string, unknown>)[key as string] ?? '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }

  if (sort) {
    result.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sort.key as string]
      const bVal = (b as Record<string, unknown>)[sort.key as string]

      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), 'ru-RU')
      }

      return sort.dir === 'asc' ? cmp : -cmp
    })
  }

  const total = result.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const pagedItems = result.slice(start, start + pageSize)

  return { items: pagedItems, total, page: safePage, pageSize, totalPages }
}

/** Merge next filter values into existing ones, clearing empty values. */
export function mergeFilters(
  current: FilterConfig,
  next: FilterConfig,
): FilterConfig {
  const merged = { ...current, ...next }

  for (const key of Object.keys(merged)) {
    if (
      merged[key] === '' ||
      merged[key] === undefined ||
      (Array.isArray(merged[key]) && (merged[key] as unknown[]).length === 0)
    ) {
      delete merged[key]
    }
  }

  return merged
}
