'use client'

import type { ReactNode } from 'react'
import {
  Search,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DataPagination,
} from '@/components/ui/data-pagination'
import {
  FilterPanel,
  type FilterField,
} from '@/components/ui/filter-panel'

export function PageHeader({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {children ? (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      ) : null}
    </div>
  )
}

export function Toolbar({
  placeholder = 'ID, наименование, магазин',
  query,
  onQueryChange,
  filters,
  filterValues,
  onFilterChange,
  onFilterReset,
  actionLabel,
  actionIcon,
  onAction,
  extra,
}: {
  placeholder?: string
  query?: string
  onQueryChange?: (value: string) => void
  filters?: FilterField[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  onFilterReset?: () => void
  actionLabel?: string
  actionIcon?: ReactNode
  onAction?: () => void
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query ?? ''}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {filters && filterValues && onFilterChange && onFilterReset ? (
        <FilterPanel
          fields={filters}
          values={filterValues}
          onChange={onFilterChange}
          onReset={onFilterReset}
        />
      ) : null}

      {extra}

      {actionLabel ? (
        <button
          onClick={onAction}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          {actionIcon}
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

export type StatusTone = 'success' | 'info' | 'warning' | 'muted'

const toneStyles: Record<StatusTone, string> = {
  success: 'bg-primary/10 text-primary',
  info: 'bg-sky-500/10 text-sky-600',
  warning: 'bg-amber-500/10 text-amber-600',
  muted: 'bg-secondary text-muted-foreground',
}

export function StatusBadge({
  label,
  tone = 'success',
}: {
  label: string
  tone?: StatusTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[13px] font-bold',
        toneStyles[tone],
      )}
    >
      {label}
    </span>
  )
}

export function MoneyCell({
  usd,
  uzs,
}: {
  usd?: string
  uzs?: string
}) {
  return (
    <div className="space-y-0.5">
      {usd ? (
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
          <span className="size-2 rounded-full bg-amber-500" />
          {usd}
        </p>
      ) : null}
      {uzs ? (
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-primary">
          <span className="size-2 rounded-full bg-primary" />
          {uzs}
        </p>
      ) : null}
    </div>
  )
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[860px]">{children}</div>
      </div>
    </div>
  )
}

export function TableHeadRow({
  columns,
}: {
  columns: { label: string; className?: string }[]
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-4 text-[14px] font-semibold text-muted-foreground">
      {columns.map((col) => (
        <div key={col.label} className={cn('flex-1', col.className)}>
          {col.label}
        </div>
      ))}
      <button
        aria-label="Настройки колонок"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
      >
        <Settings2 className="size-4" />
      </button>
    </div>
  )
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-5 text-[15px] text-foreground transition-colors last:border-b-0 hover:bg-secondary/50">
      {children}
    </div>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function Pagination({
  page = 1,
  pages = 1,
  pageSize = 10,
  total,
  onPage,
  onPageSize,
  pageSizeOptions,
  extra,
}: {
  page?: number
  pages?: number
  pageSize?: number
  total?: number
  onPage?: (page: number) => void
  onPageSize?: (size: number) => void
  pageSizeOptions?: number[]
  extra?: ReactNode
}) {
  const computedTotal = total ?? pages * pageSize

  return (
    <DataPagination
      page={page}
      totalPages={Math.max(1, pages)}
      pageSize={pageSize}
      total={computedTotal}
      onPage={onPage ?? (() => {})}
      onPageSize={onPageSize ?? (() => {})}
      pageSizeOptions={pageSizeOptions}
      exportButton={extra}
    />
  )
}
