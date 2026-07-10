'use client'

import { useEffect, useState } from 'react'
import { useDashboardSummary } from './use-dashboard-summary'
import { getFinanceReportSummary } from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'

function CircularProgress({ value }: { value: number }) {
  const [progress, setProgress] = useState(0)
  const size = 148
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 150)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}%
        </span>
        <span className="text-xs text-muted-foreground">от плана</span>
      </div>
    </div>
  )
}

export function BusinessSummary() {
  const summary = useDashboardSummary()
  const financeSummary = getFinanceReportSummary()
  const target = Math.max(summary.salesTotal, 1_000_000)
  const progress = Math.min(100, Math.round((summary.salesTotal / target) * 100))
  const averageCheck = summary.salesCount > 0 ? Math.round(summary.salesTotal / summary.salesCount) : 0

  const rows = [
    { label: 'Выручка', value: `${formatUZS(summary.salesTotal)} UZS`, tone: 'text-foreground' },
    { label: 'Средний чек', value: `${formatUZS(averageCheck)} UZS`, tone: 'text-foreground' },
    { label: 'Расходы', value: `${formatUZS(financeSummary.expenseTotal)} UZS`, tone: 'text-foreground' },
    { label: 'Низкий остаток', value: `${summary.lowStockCount}`, tone: 'text-warning' },
    { label: 'Нет в наличии', value: `${summary.outOfStockCount}`, tone: 'text-danger' },
  ]

  return (
    <div className="animate-fade-up rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.1)] sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Сводка бизнеса</h2>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Сегодня
        </span>
      </div>

      <div className="mt-5 flex flex-col items-center rounded-2xl bg-secondary/50 py-6">
        <p className="mb-3 text-sm font-medium text-muted-foreground">План на сегодня</p>
        <CircularProgress value={progress} />
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatUZS(summary.salesTotal)} UZS</span>{' '}
          из {formatUZS(target)} UZS
        </p>
      </div>

      <div className="mt-5 space-y-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/60"
          >
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className={`text-sm font-semibold tabular-nums ${row.tone}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
