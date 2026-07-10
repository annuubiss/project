'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, Pencil, Search, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* --------------------------- Detail page header ---------------------------- */

export function DetailHeader({
  title,
  subtitle,
  backHref,
  editable,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  backHref: string
  editable?: boolean
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="flex items-start gap-4">
        <Link
          href={backHref}
          aria-label="Назад"
          className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {editable ? (
              <button
                aria-label="Переименовать"
                className="flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary"
              >
                <Pencil className="size-5" />
              </button>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-[15px] font-medium text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </div>
  )
}

/* --------------------------------- Buttons --------------------------------- */

export function PrimaryButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-9 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  tone = 'muted',
  className,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: 'muted' | 'danger'
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-8 text-[15px] font-semibold shadow-sm ring-1 ring-border transition-colors hover:bg-secondary',
        tone === 'danger' ? 'text-destructive' : 'text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* -------------------------------- Sub tabs --------------------------------- */

export function SubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { label: string; count?: number }[]
  active: number
  onChange: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border">
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          onClick={() => onChange(i)}
          className={cn(
            '-mb-px border-b-2 px-4 pb-4 pt-2 text-[15px] font-bold transition-colors',
            active === i
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          {tab.count !== undefined ? ` (${tab.count})` : ''}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------ Segmented tabs ----------------------------- */

export function SegmentedTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: number
  onChange: (i: number) => void
}) {
  return (
    <div
      className={cn(
        'grid gap-2 rounded-2xl bg-secondary p-1.5',
        tabs.length === 2 && 'grid-cols-2',
        tabs.length === 3 && 'grid-cols-3',
        tabs.length === 4 && 'grid-cols-2 sm:grid-cols-4',
        tabs.length >= 5 && 'grid-cols-3 sm:grid-cols-5',
      )}
    >
      {tabs.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange(i)}
          className={cn(
            'rounded-2xl py-3.5 text-center text-[15px] font-semibold transition-colors',
            active === i
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/* --------------------------------- Stat card ------------------------------- */

export function StatCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string
  value: string
  unit?: string
  icon: ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-3xl p-6 shadow-sm ring-1',
        accent
          ? 'bg-primary text-primary-foreground ring-primary'
          : 'bg-card ring-border',
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            'text-[14px] font-medium',
            accent ? 'text-primary-foreground/80' : 'text-muted-foreground',
          )}
        >
          {label}
        </p>
        <p className="mt-2 text-2xl font-black">
          {value}
          {unit ? (
            <span
              className={cn(
                'ml-1 text-base font-semibold',
                accent ? 'text-primary-foreground/80' : 'text-muted-foreground',
              )}
            >
              {unit}
            </span>
          ) : null}
        </p>
      </div>
      <div
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-2xl',
          accent ? 'bg-primary-foreground/15' : 'bg-accent text-primary',
        )}
      >
        {icon}
      </div>
    </div>
  )
}

/* ---------------------------- Search + scan bar ---------------------------- */

export function DetailToolbar({
  placeholder = 'Поиск по таблице',
  value,
  onChange,
  right,
}: {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  right?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
        />
      </div>
      {right}
    </div>
  )
}

/* ----------------------------- Number cell input --------------------------- */

export function QtyInput({
  value,
  onChange,
  suffix,
  className,
}: {
  value: string
  onChange: (v: string) => void
  suffix?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-12 items-center overflow-hidden rounded-xl bg-background ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/40',
        className,
      )}
    >
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full w-full min-w-0 bg-transparent px-3 text-[15px] font-semibold text-foreground outline-none"
      />
      {suffix ? (
        <span className="px-3 text-[13px] font-medium text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

/* ------------------------------- Table shell ------------------------------- */

export function DetailTableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[900px]">{children}</div>
      </div>
    </div>
  )
}

/**
 * Builds the full grid-template-columns for a detail table row, prepending a
 * fixed checkbox track and appending a fixed settings track when present.
 * Header and body rows share the exact same template so every column lines up.
 */
function gridTemplate(
  template: string | undefined,
  withCheckbox?: boolean,
  withSettings?: boolean,
) {
  return [
    withCheckbox ? '1.25rem' : null,
    template ?? 'repeat(auto-fit, minmax(0, 1fr))',
    withSettings ? '2.25rem' : null,
  ]
    .filter(Boolean)
    .join(' ')
}

export function DetailHeadRow({
  columns,
  template,
  withCheckbox,
  withSettings = true,
}: {
  columns: { label: string; className?: string }[]
  template?: string
  withCheckbox?: boolean
  withSettings?: boolean
}) {
  return (
    <div
      className="grid items-center gap-4 border-b border-border px-6 py-4 text-[14px] font-semibold text-muted-foreground"
      style={{
        gridTemplateColumns: gridTemplate(template, withCheckbox, withSettings),
      }}
    >
      {withCheckbox ? (
        <input
          type="checkbox"
          aria-label="Выбрать все"
          className="size-5 rounded-md border border-border accent-primary"
        />
      ) : null}
      {columns.map((col) => (
        <div key={col.label} className={cn('min-w-0', col.className)}>
          {col.label}
        </div>
      ))}
      {withSettings ? (
        <button
          aria-label="Настройки колонок"
          className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings2 className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export function DetailRow({
  children,
  template,
  withCheckbox,
  withSettings = true,
}: {
  children: ReactNode
  template?: string
  withCheckbox?: boolean
  withSettings?: boolean
}) {
  return (
    <div
      className="grid items-center gap-4 border-b border-border px-6 py-4 text-[15px] text-foreground transition-colors last:border-b-0 hover:bg-secondary/50"
      style={{
        gridTemplateColumns: gridTemplate(template, withCheckbox, withSettings),
      }}
    >
      {withCheckbox ? (
        <input
          type="checkbox"
          aria-label="Выбрать строку"
          className="size-5 rounded-md border border-border accent-primary"
        />
      ) : null}
      {children}
    </div>
  )
}
