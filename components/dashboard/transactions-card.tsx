'use client'

import { Menu } from 'lucide-react'
import { useDashboardSummary } from './use-dashboard-summary'

export function TransactionsCard() {
  const summary = useDashboardSummary()

  return (
    <section className="flex items-center justify-between rounded-3xl bg-card p-7 shadow-sm">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">Транзакции</h3>
        <p className="mt-4 text-4xl font-black tracking-tight text-primary">
          {summary.transactionCount} <span className="text-foreground">шт</span>
        </p>
      </div>
      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <Menu className="size-8" />
      </div>
    </section>
  )
}
