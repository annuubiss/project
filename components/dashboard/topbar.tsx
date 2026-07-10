'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const periods = ['Вчера', 'Сегодня', 'Неделя', 'Месяц', 'Год']

export function Topbar() {
  const [active, setActive] = useState('Сегодня')
  const today = useMemo(() => new Intl.DateTimeFormat('ru-RU').format(new Date()), [])

  return (
    <div className="mb-6 space-y-6">
      <button className="group flex items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight text-foreground text-balance sm:text-[34px]">
          Все магазины
        </h1>
        <ChevronDown className="size-7 text-foreground transition-transform group-hover:translate-y-0.5" />
      </button>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1 self-start rounded-2xl bg-card p-1.5 shadow-sm">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setActive(p)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-all duration-200 sm:px-5',
                active === p
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 self-start rounded-2xl bg-card px-5 py-3 shadow-sm lg:self-auto">
          <CalendarDays className="size-5 text-primary" />
          <span className="text-[15px] font-semibold text-foreground">{today}</span>
        </div>
      </div>
    </div>
  )
}
