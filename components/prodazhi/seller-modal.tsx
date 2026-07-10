'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { readSellers, type ErpSeller } from '@/lib/erp/erp-store'
import { statusColor } from './pos-data'

export function SellerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (seller: ErpSeller) => void
}) {
  const [query, setQuery] = useState('')
  const [sellers, setSellers] = useState<ErpSeller[]>([])

  useEffect(() => {
    if (open) setSellers(readSellers())
  }, [open])

  if (!open) return null

  const filtered = sellers.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-16 w-full max-w-2xl rounded-3xl bg-card p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <button
            aria-label="Назад"
            onClick={onClose}
            className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            Добавить продавца
          </h2>
        </div>

        <div className="mb-4 rounded-2xl bg-secondary/60 px-5 py-4 text-center text-[15px] text-muted-foreground">
          Найдите продавца через поиск или отсканируйте его карту
        </div>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите имя продавца"
            className="h-13 w-full rounded-2xl bg-secondary py-4 pl-12 pr-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="flex w-full items-center gap-3 rounded-2xl bg-secondary/60 px-5 py-4 text-left text-[15px] font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <span className={cn('size-3 shrink-0 rounded-full', statusColor[s.status])} />
              {s.name}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-[15px] text-muted-foreground">
              Продавцы не найдены
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
