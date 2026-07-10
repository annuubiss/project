'use client'

import { useState } from 'react'
import { Search, Filter, ChevronDown, Plus, CreditCard } from 'lucide-react'

export function GiftCards() {
  const [query, setQuery] = useState('')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        Подарочные карты
      </h1>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ID, номер карты"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
          <ChevronDown className="size-4 text-muted-foreground" />
          <Filter className="size-4 text-primary" />
          Фильтры
        </button>
        <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90">
          <Plus className="size-5" />
          Новая карта
        </button>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-card px-6 py-24 text-center shadow-sm ring-1 ring-border">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="size-8" />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">Подарочных карт пока нет</p>
          <p className="text-[15px] text-muted-foreground">
            Выпустите подарочные карты, чтобы клиенты могли дарить покупки.
          </p>
        </div>
      </div>
    </div>
  )
}
