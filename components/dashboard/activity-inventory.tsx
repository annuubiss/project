'use client'

import {
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  UserPlus,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardFeed } from './use-dashboard-feed'

const iconMap = {
  order: ShoppingCart,
  payment: CreditCard,
  alert: AlertTriangle,
  user: UserPlus,
  invoice: FileText,
} as const

const toneMap = {
  order: 'bg-primary/10 text-primary',
  payment: 'bg-success/10 text-success',
  alert: 'bg-warning/10 text-warning',
  user: 'bg-chart-4/10 text-chart-4',
  invoice: 'bg-muted text-muted-foreground',
} as const

const statusStyle = {
  low: 'bg-warning/10 text-warning',
  critical: 'bg-danger/10 text-danger',
  out: 'bg-danger/10 text-danger',
} as const

const statusLabel = {
  low: 'Мало',
  critical: 'Критично',
  out: 'Нет',
} as const

export function ActivityInventory() {
  const feed = useDashboardFeed()

  return (
    <div className="animate-fade-up rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.1)] sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-foreground">Последние действия</h2>
      <div className="mt-4 space-y-4">
        {feed.recentActivity.length > 0 ? (
          feed.recentActivity.map((activity, index) => {
            const Icon = iconMap[activity.type]
            return (
              <div key={`${activity.text}-${index}`} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                    toneMap[activity.type],
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-muted-foreground">Пока нет действий.</p>
        )}
      </div>

      <div className="my-5 h-px bg-border" />

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Контроль остатков
        </h3>
        <AlertTriangle className="size-4 text-warning" />
      </div>
      <div className="mt-4 space-y-2">
        {feed.inventoryAlerts.length > 0 ? (
          feed.inventoryAlerts.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Осталось: {item.level} шт.</p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  statusStyle[item.status],
                )}
              >
                {statusLabel[item.status]}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Остатки под контролем.</p>
        )}
      </div>
    </div>
  )
}
