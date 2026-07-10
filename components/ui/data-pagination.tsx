'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ArrowDownUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  page: number
  totalPages: number
  pageSize: number
  total: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
  pageSizeOptions?: number[]
  exportButton?: ReactNode
}

const DEFAULT_SIZES = [25, 50, 100, 200]

export function DataPagination({
  page,
  totalPages,
  pageSize,
  total,
  onPage,
  onPageSize,
  pageSizeOptions = DEFAULT_SIZES,
  exportButton,
}: Props) {
  const pages = buildPageNumbers(page, totalPages)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label="Предыдущая страница"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
          className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>

        {pages.map((item, index) =>
          item === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-10 items-center justify-center text-[15px] text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item)}
              className={cn(
                'flex size-10 items-center justify-center rounded-xl text-[15px] font-semibold transition-colors',
                item === page
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'bg-card text-foreground shadow-sm ring-1 ring-border hover:bg-secondary',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          aria-label="Следующая страница"
          disabled={page >= totalPages}
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>

        <span className="ml-2 text-[14px] text-muted-foreground">
          {from}-{to} из {total}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {exportButton}
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSize(Number(e.target.value))
              onPage(1)
            }}
            className="flex h-10 cursor-pointer appearance-none items-center gap-2 rounded-xl bg-card pl-4 pr-10 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                По {size}
              </option>
            ))}
          </select>
          <ArrowDownUp className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
        </div>
      </div>
    </div>
  )
}

function buildPageNumbers(current: number, total: number): Array<number | '...'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: Array<number | '...'> = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i += 1) {
    pages.push(i)
  }

  if (current < total - 2) pages.push('...')
  pages.push(total)

  return pages
}
