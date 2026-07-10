'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUZS } from '@/lib/erp/product-catalog'
import { useDashboardSummary } from './use-dashboard-summary'

export function SalesAnalytics() {
  const [chartOn, setChartOn] = useState(false)
  const summary = useDashboardSummary()
  const hasSales = summary.salesCount > 0
  const maxPoint = Math.max(...summary.chartPoints.map((point) => point.total), 1)

  return (
    <section className="rounded-3xl bg-card p-6 shadow-sm sm:p-7">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Продажи</h2>
            <button className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-5 py-3 text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <span>
                Детализация:{' '}
                <span className="font-semibold text-muted-foreground">по дням</span>
              </span>
              <ChevronDown className="size-5" />
            </button>
          </div>

          <div className="mt-6 flex min-h-[340px] items-center justify-center rounded-2xl border-2 border-dashed border-border">
            {hasSales ? (
              <div className="flex h-[280px] w-full items-end gap-3 px-4 sm:px-8">
                {summary.chartPoints.map((point) => (
                  <div
                    key={point.label}
                    className="flex min-w-0 flex-1 flex-col items-center gap-3"
                  >
                    <div className="flex h-56 w-full items-end rounded-full bg-secondary/60 px-1.5">
                      <div
                        className="w-full rounded-full bg-primary transition-all"
                        style={{
                          height: `${Math.max(8, (point.total / maxPoint) * 100)}%`,
                        }}
                        title={`${formatUZS(point.total)} UZS`}
                      />
                    </div>
                    <span className="truncate text-xs font-semibold text-muted-foreground">
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="max-w-[240px] text-center text-[15px] font-medium leading-relaxed text-muted-foreground/70 text-pretty">
                Чтобы увидеть график, оформите первую продажу
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col border-t border-border pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-muted-foreground">Общий график</span>
            <button
              role="switch"
              aria-checked={chartOn}
              onClick={() => setChartOn((v) => !v)}
              aria-label="Общий график"
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
                chartOn ? 'bg-primary' : 'bg-border',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 size-5 rounded-full bg-card shadow-sm transition-transform duration-200',
                  chartOn ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-sm ring-1 ring-border">
            <span className="size-3 shrink-0 rounded-full bg-chart-4" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold text-foreground">
                Магазин / Подвал
              </span>
              <span className="text-[15px] font-semibold text-primary">
                {formatUZS(summary.salesTotal)} UZS
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-[15px] text-muted-foreground">Общая сумма:</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-foreground">
              {formatUZS(summary.salesTotal)} UZS
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
