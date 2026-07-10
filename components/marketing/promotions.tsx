'use client'

import { useState } from 'react'
import { Search, Filter, ChevronDown, Plus, Pencil, Pause, Trash2, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'Активный' | 'Черновик' | 'Завершен'

type Promo = {
  store: string
  name: string
  start: string
  end: string
  status: Status
  description: string
  type: string
}

const promos: Promo[] = [
  {
    store: 'Магазин / Подвал',
    name: 'Скидка на казаны 10%',
    start: '2026.07.01 09:00:00',
    end: '2026.07.15 21:00:00',
    status: 'Активный',
    description: 'Акция для розничных покупателей',
    type: 'Скидка X% на товары',
  },
  {
    store: 'Магазин / Подвал',
    name: 'Оптовая цена на сковороды',
    start: '2026.07.03 09:00:00',
    end: '2026.07.20 21:00:00',
    status: 'Активный',
    description: 'Для постоянных оптовых клиентов',
    type: 'Оптовая скидка',
  },
  {
    store: 'Склад №1',
    name: 'Чайник + крышка со скидкой',
    start: '2026.07.05 10:00:00',
    end: '2026.07.18 20:00:00',
    status: 'Черновик',
    description: 'Комплектная продажа',
    type: 'Купите товар и получите скидку',
  },
  {
    store: 'Магазин / Подвал',
    name: 'Наборы ножей - 15%',
    start: '2026.06.20 09:00:00',
    end: '2026.06.30 21:00:00',
    status: 'Завершен',
    description: 'Завершенная сезонная акция',
    type: 'Скидка X% на товары',
  },
  {
    store: 'Склад №2',
    name: 'Кастрюли по спеццене',
    start: '2026.07.08 09:00:00',
    end: '2026.07.31 21:00:00',
    status: 'Активный',
    description: 'Продвижение новой партии',
    type: 'Скидка X% на товары',
  },
  {
    store: 'Магазин / Подвал',
    name: 'Подарок за покупку от 500 000 UZS',
    start: '2026.07.10 09:00:00',
    end: '2026.07.25 21:00:00',
    status: 'Черновик',
    description: 'Подарочная кухонная принадлежность',
    type: 'Подарок к покупке',
  },
]

const tabs = [
  { label: 'Все', count: promos.length },
  { label: 'Активные', count: promos.filter((item) => item.status === 'Активный').length },
  { label: 'Не активные', count: promos.filter((item) => item.status !== 'Активный').length },
  { label: 'Запланированные', count: 0 },
]

const statusStyles: Record<Status, string> = {
  Активный: 'bg-chart-2/15 text-chart-2',
  Черновик: 'bg-secondary text-muted-foreground',
  Завершен: 'bg-destructive/15 text-destructive',
}

export function Promotions() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('Все')

  const filtered = promos.filter((p) => {
    if (tab === 'Активные' && p.status !== 'Активный') return false
    if (tab === 'Не активные' && p.status === 'Активный') return false
    if (tab === 'Запланированные') return false
    return (
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.store.toLowerCase().includes(query.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        Акции
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.label)}
            className={cn(
              'rounded-2xl px-5 py-2.5 text-[15px] font-semibold transition-colors',
              tab === t.label
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground ring-1 ring-border hover:bg-secondary',
            )}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ID, магазин, наименование"
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
          Новая акция
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-sm ring-1 ring-border">
        <div className="min-w-[1080px]">
          <div className="flex items-center gap-4 border-b border-border px-4 py-4 text-[14px] font-semibold text-muted-foreground">
            <div className="flex-1">Магазин</div>
            <div className="flex-1">Наименование</div>
            <div className="flex-1">Начало</div>
            <div className="flex-1">Конец</div>
            <div className="w-[120px] shrink-0">Статус</div>
            <div className="flex-1">Описание</div>
            <div className="flex-1">Тип акции</div>
            <div className="w-[120px] shrink-0 text-right">Действия</div>
            <button
              aria-label="Настройки колонок"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings2 className="size-4" />
            </button>
          </div>

          {filtered.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex items-center gap-4 border-b border-border px-4 py-4 text-[15px] transition-colors last:border-0 hover:bg-secondary/50"
            >
              <div className="flex-1 text-muted-foreground">{p.store}</div>
              <div className="flex-1 font-semibold text-primary">{p.name}</div>
              <div className="flex-1 text-foreground">{p.start}</div>
              <div className="flex-1 text-foreground">{p.end}</div>
              <div className="w-[120px] shrink-0">
                <span
                  className={cn(
                    'inline-flex rounded-full px-3 py-1.5 text-[13px] font-semibold',
                    statusStyles[p.status],
                  )}
                >
                  {p.status}
                </span>
              </div>
              <div className="flex-1 text-muted-foreground">{p.description}</div>
              <div className="flex-1 text-foreground">{p.type}</div>
              <div className="flex w-[120px] shrink-0 items-center justify-end gap-2">
                <button
                  aria-label="Редактировать"
                  className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  aria-label={p.status === 'Активный' ? 'Приостановить' : 'Запустить'}
                  disabled={p.status !== 'Активный'}
                  className="flex size-9 items-center justify-center rounded-xl bg-chart-3 text-white transition-colors hover:bg-chart-3/90 disabled:opacity-40"
                >
                  <Pause className="size-4" />
                </button>
                <button
                  aria-label="Удалить"
                  className="flex size-9 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="size-9 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
