'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardFeed } from './use-dashboard-feed'

const tabs = ['Товары', 'Категории', 'Клиенты'] as const
type Tab = (typeof tabs)[number]

export function TopLists() {
  const [tab, setTab] = useState<Tab>('Товары')
  const feed = useDashboardFeed()

  return (
    <div className="animate-fade-up rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.1)] sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-foreground">Лучшие показатели</h2>

      <div className="mt-4 flex items-center gap-0.5 rounded-xl border border-border bg-secondary/60 p-0.5">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
              tab === item
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1">
        {tab === 'Товары' &&
          (feed.topProducts.length > 0 ? (
            feed.topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary/60"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Продано: {product.sold}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{product.revenue}</p>
                  <p className="flex items-center justify-end gap-0.5 text-xs font-medium text-success">
                    <ArrowUpRight className="size-3" />
                    {product.trend}%
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyList text="Продаж по товарам пока нет." />
          ))}

        {tab === 'Категории' &&
          (feed.topCategories.length > 0 ? (
            feed.topCategories.map((category) => (
              <div key={category.name} className="rounded-xl px-2 py-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">{category.share}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${category.share}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyList text="Данных по категориям пока нет." />
          ))}

        {tab === 'Клиенты' &&
          (feed.topCustomers.length > 0 ? (
            feed.topCustomers.map((customer) => (
              <div
                key={customer.name}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary/60"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                  {customer.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">Покупок: {customer.orders}</p>
                </div>
                <p className="text-sm font-semibold text-foreground tabular-nums">{customer.spend}</p>
              </div>
            ))
          ) : (
            <EmptyList text="Покупок по клиентам пока нет." />
          ))}
      </div>
    </div>
  )
}

function EmptyList({ text }: { text: string }) {
  return <p className="px-2 py-8 text-sm text-muted-foreground">{text}</p>
}
