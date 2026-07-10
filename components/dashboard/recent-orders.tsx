'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardFeed } from './use-dashboard-feed'

type OrderStatus = 'Completed' | 'Processing' | 'Shipped' | 'Cancelled'

const statusStyle: Record<OrderStatus, string> = {
  Completed: 'bg-success/10 text-success',
  Processing: 'bg-primary/10 text-primary',
  Shipped: 'bg-chart-5/10 text-chart-5',
  Cancelled: 'bg-danger/10 text-danger',
}

const statusLabel: Record<OrderStatus | 'All', string> = {
  All: 'Все',
  Completed: 'Завершено',
  Processing: 'В работе',
  Shipped: 'Выдано',
  Cancelled: 'Отменено',
}

const payStyle = {
  Paid: 'bg-success/10 text-success',
  Pending: 'bg-warning/10 text-warning',
  Failed: 'bg-danger/10 text-danger',
} as const

const payLabel = {
  Paid: 'Оплачено',
  Pending: 'Ожидает',
  Failed: 'Ошибка',
} as const

const filters: (OrderStatus | 'All')[] = ['All', 'Completed', 'Processing', 'Shipped', 'Cancelled']

export function RecentOrders() {
  const feed = useDashboardFeed()
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All')
  const [query, setQuery] = useState('')
  const [sortAsc, setSortAsc] = useState(false)

  const rows = useMemo(() => {
    let list = [...feed.recentOrders]
    if (filter !== 'All') list = list.filter((order) => order.status === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (order) =>
          order.customer.toLowerCase().includes(q) ||
          order.id.toLowerCase().includes(q) ||
          order.products.toLowerCase().includes(q),
      )
    }
    list.sort((left, right) => {
      const leftAmount = Number(left.amount.replace(/[^\d]/g, ''))
      const rightAmount = Number(right.amount.replace(/[^\d]/g, ''))
      return sortAsc ? leftAmount - rightAmount : rightAmount - leftAmount
    })
    return list
  }, [feed.recentOrders, filter, query, sortAsc])

  return (
    <section className="animate-fade-up rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.1)] sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Последние продажи</h2>
          <p className="text-sm text-muted-foreground">Найдено записей: {rows.length}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по чеку, клиенту, товару"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-64"
            />
          </div>
          <button className="flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <span className="hidden sm:inline">Фильтры</span>
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === item
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            {statusLabel[item]}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 text-xs font-medium text-muted-foreground">Чек</th>
              <th className="pb-3 text-xs font-medium text-muted-foreground">Клиент</th>
              <th className="pb-3 text-xs font-medium text-muted-foreground">Товары</th>
              <th className="pb-3 text-xs font-medium text-muted-foreground">Статус</th>
              <th className="pb-3 text-xs font-medium text-muted-foreground">Оплата</th>
              <th className="pb-3 text-xs font-medium text-muted-foreground">Дата</th>
              <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                <button
                  onClick={() => setSortAsc((value) => !value)}
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  Сумма
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order, index) => (
              <tr
                key={`${order.id}-${order.date}-${index}`}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
              >
                <td className="py-3.5">
                  <span className="font-mono text-xs font-medium text-foreground">{order.id}</span>
                </td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
                      {order.initials}
                    </span>
                    <span className="text-sm font-medium text-foreground">{order.customer}</span>
                  </div>
                </td>
                <td className="py-3.5 text-sm text-muted-foreground">{order.products}</td>
                <td className="py-3.5">
                  <span
                    className={cn(
                      'inline-block rounded-full px-2.5 py-1 text-xs font-semibold',
                      statusStyle[order.status],
                    )}
                  >
                    {statusLabel[order.status]}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className={cn('inline-block rounded-full px-2.5 py-1 text-xs font-semibold', payStyle[order.payment])}>
                    {payLabel[order.payment]}
                  </span>
                </td>
                <td className="py-3.5 text-sm text-muted-foreground">{order.date}</td>
                <td className="py-3.5 text-right text-sm font-semibold text-foreground tabular-nums">
                  {order.amount}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  По выбранным фильтрам продаж нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          Показано <span className="font-medium text-foreground">{rows.length}</span> из{' '}
          <span className="font-medium text-foreground">{feed.recentOrders.length}</span>
        </p>
        <div className="flex items-center gap-1">
          <button className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40">
            <ChevronLeft className="size-4" />
          </button>
          <button className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
            1
          </button>
          <button className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
