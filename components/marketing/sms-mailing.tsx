'use client'

import { useState } from 'react'
import { Search, Filter, ChevronDown, Plus, Pause, Trash2, ArrowDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Sms = {
  id: string
  text: string
  sent: number
  delivered: number
  cost: string
  status: string
  groups: string
  tags: string
  sendDate: string
  endDate: string
}

const messages: Sms[] = [
  { id: '416109', text: 'Новое поступление казанов - скидка 10%', sent: 88, delivered: 82, cost: '0 UZS', status: 'Новый', groups: 'Постоянные', tags: 'Казаны', sendDate: '-', endDate: '-' },
  { id: '498235', text: 'Сковороды и кастрюли по оптовой цене', sent: 120, delivered: 116, cost: '0 UZS', status: 'Завершен', groups: 'Оптовики', tags: 'Опт', sendDate: '2026.07.01', endDate: '2026.07.01' },
  { id: '522411', text: 'При покупке набора ножей - подарок', sent: 0, delivered: 0, cost: '0 UZS', status: 'Запланирован', groups: 'VIP', tags: 'Ножи', sendDate: '2026.07.10', endDate: '-' },
  { id: '647456', text: 'Чайники и крышки снова в наличии', sent: 0, delivered: 0, cost: '0 UZS', status: 'Новый', groups: '-', tags: 'Склад', sendDate: '-', endDate: '-' },
  { id: '295473', text: 'Акция на кухонные принадлежности', sent: 88, delivered: 80, cost: '0 UZS', status: 'Завершен', groups: 'Розница', tags: 'Акция', sendDate: '2026.07.03', endDate: '2026.07.03' },
  { id: '754788', text: 'Оптовым клиентам специальные цены', sent: 0, delivered: 0, cost: '0 UZS', status: 'На модерации', groups: 'Оптовики', tags: 'Опт', sendDate: '-', endDate: '-' },
  { id: '151549', text: 'Скидка на крышки 15% до конца недели', sent: 0, delivered: 0, cost: '0 UZS', status: 'В процессе', groups: 'Постоянные', tags: 'Крышки', sendDate: '2026.07.08', endDate: '-' },
  { id: '977360', text: 'Верните клиента: персональная скидка', sent: 88, delivered: 74, cost: '0 UZS', status: 'Завершен', groups: 'Неактивные', tags: 'CRM', sendDate: '2026.07.04', endDate: '2026.07.04' },
]

const tabs = ['Все', 'Завершен', 'В процессе', 'Запланирован', 'Отменен', 'Не доставлен', 'Отклонено', 'На модерации', 'Новый']

export function SmsMailing() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('Все')

  const filtered = messages.filter((m) => {
    if (tab !== 'Все' && m.status !== tab) return false
    return m.text.toLowerCase().includes(query.toLowerCase()) || m.id.includes(query)
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        SMS рассылка
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-2xl px-4 py-2.5 text-[15px] font-semibold transition-colors',
              tab === t
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground ring-1 ring-border hover:bg-secondary',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ID, текст рассылки"
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
          Новая рассылка
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-sm ring-1 ring-border">
        <div className="min-w-[1120px]">
          <div className="flex items-center gap-4 border-b border-border px-4 py-4 text-[14px] font-semibold text-muted-foreground">
            <div className="w-[90px] shrink-0">ID</div>
            <div className="flex-1">Текст рассылки</div>
            <div className="w-[90px] shrink-0">Кол-во</div>
            <div className="flex-1">Стоимость</div>
            <div className="w-[120px] shrink-0">Статус</div>
            <div className="flex-1">Группы</div>
            <div className="flex-1">Теги</div>
            <div className="flex-1">Дата отправки</div>
            <div className="flex-1">Дата завершения</div>
            <div className="w-[100px] shrink-0 text-right">Действия</div>
          </div>

          {filtered.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 border-b border-border px-4 py-4 text-[15px] transition-colors last:border-0 hover:bg-secondary/50"
            >
              <div className="w-[90px] shrink-0 font-medium text-muted-foreground">{m.id}</div>
              <div className="flex-1 font-semibold text-primary">{m.text}</div>
              <div className="w-[90px] shrink-0">
                <div className="flex flex-col gap-1 text-[13px] font-semibold">
                  <span className="flex items-center gap-1 text-primary">
                    <ArrowDown className="size-3.5" />
                    {m.sent}
                  </span>
                  <span className="flex items-center gap-1 text-chart-2">
                    <Check className="size-3.5" />
                    {m.delivered}
                  </span>
                </div>
              </div>
              <div className="flex-1 text-foreground">{m.cost}</div>
              <div className="w-[120px] shrink-0">
                <span className="inline-flex w-full items-center justify-center rounded-full bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground">
                  {m.status}
                </span>
              </div>
              <div className="flex-1 text-muted-foreground">{m.groups}</div>
              <div className="flex-1 text-muted-foreground">{m.tags}</div>
              <div className="flex-1 text-muted-foreground">{m.sendDate}</div>
              <div className="flex-1 text-muted-foreground">{m.endDate}</div>
              <div className="flex w-[100px] shrink-0 items-center justify-end gap-2">
                <button
                  aria-label="Приостановить"
                  className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pause className="size-4" />
                </button>
                <button
                  aria-label="Удалить"
                  className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
