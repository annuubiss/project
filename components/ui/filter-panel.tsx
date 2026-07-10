'use client'

import { type ReactNode, useState } from 'react'
import { Filter, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FilterField = {
  key: string
  label: string
  type: 'select' | 'text' | 'date-range'
  options?: { value: string; label: string }[]
}

type Props = {
  fields: FilterField[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onReset: () => void
  triggerLabel?: string
  footer?: ReactNode
}

export function FilterPanel({
  fields,
  values,
  onChange,
  onReset,
  triggerLabel = 'Фильтры',
  footer,
}: Props) {
  const [open, setOpen] = useState(false)
  const activeCount = Object.values(values).filter(Boolean).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary',
          activeCount > 0 && 'ring-primary/40',
        )}
      >
        <ChevronDown className="size-4 text-muted-foreground" />
        <Filter className="size-4 text-primary" />
        {triggerLabel}
        {activeCount > 0 ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-16 z-30 w-80 overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-[15px] font-bold text-foreground">Фильтры</span>
              <button
                onClick={() => {
                  onReset()
                  setOpen(false)
                }}
                className="text-[13px] font-semibold text-primary hover:text-primary/80"
              >
                Сбросить
              </button>
            </div>

            <div className="space-y-4 p-5">
              {fields.map((field) => (
                <FilterFieldInput
                  key={field.key}
                  field={field}
                  value={values[field.key] ?? ''}
                  onChange={(value) => onChange(field.key, value)}
                />
              ))}
            </div>

            <div className="border-t border-border px-5 py-4">
              {footer}
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-2xl bg-primary py-3 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Применить
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function FilterFieldInput({
  field,
  value,
  onChange,
}: {
  field: FilterField
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-muted-foreground">
        {field.label}
      </label>

      {field.type === 'select' ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl bg-secondary px-4 pr-9 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
          >
            <option value="">Все</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      ) : field.type === 'date-range' ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl bg-secondary px-4 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Поиск по ${field.label.toLowerCase()}`}
            className="h-11 w-full rounded-xl bg-secondary px-4 pr-9 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
          />
          {value ? (
            <button
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function useFilters(initial: Record<string, string> = {}) {
  const [values, setValues] = useState<Record<string, string>>(initial)

  function onChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function onReset() {
    setValues(initial)
  }

  return { values, onChange, onReset }
}
