'use client'

import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardSummary } from './use-dashboard-summary'
import { getClientReportSummary } from '@/lib/erp/erp-store'

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

type Stat = {
  title: string
  value: number
  suffix?: string
  icon: React.ElementType
  change: number
  sub: string
  data: { i: number; v: number }[]
  color: string
}

export function StatCards() {
  const summary = useDashboardSummary()
  const clientSummary = getClientReportSummary()

  const stats: Stat[] = [
    {
      title: 'Выручка',
      value: summary.salesTotal,
      suffix: ' UZS',
      icon: Wallet,
      change: summary.salesCount > 0 ? 100 : 0,
      sub: `${summary.salesCount} чеков`,
      data: summary.chartPoints.map((point, index) => ({ i: index, v: point.total })),
      color: 'var(--chart-1)',
    },
    {
      title: 'Продано товаров',
      value: summary.soldQty,
      icon: ShoppingBag,
      change: summary.soldQty > 0 ? 100 : 0,
      sub: `${summary.salesCount} продаж`,
      data: summary.chartPoints.map((point, index) => ({ i: index, v: point.count })),
      color: 'var(--chart-2)',
    },
    {
      title: 'Покупатели',
      value: clientSummary.buyersCount,
      icon: Users,
      change: clientSummary.returningClientsCount > 0 ? 100 : 0,
      sub: `${clientSummary.returningClientsCount} постоянных`,
      data: summary.chartPoints.map((point, index) => ({
        i: index,
        v: point.count > 0 ? clientSummary.buyersCount : 0,
      })),
      color: 'var(--chart-3)',
    },
    {
      title: 'Поступления',
      value: summary.paymentsTotal,
      suffix: ' UZS',
      icon: TrendingUp,
      change: summary.paymentsTotal > 0 ? 100 : 0,
      sub: `${summary.transactionCount} операций`,
      data: summary.chartPoints.map((point, index) => ({ i: index, v: point.total })),
      color: 'var(--chart-5)',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.title} stat={stat} index={index} />
      ))}
    </div>
  )
}

function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const animated = useCountUp(stat.value)
  const positive = stat.change >= 0
  const Icon = stat.icon
  const gradId = useRef(`grad-${stat.title}`).current

  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(animated)

  return (
    <div
      className="group animate-fade-up rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.22)]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex size-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `color-mix(in oklab, ${stat.color} 12%, transparent)` }}
        >
          <Icon className="size-5" style={{ color: stat.color }} />
        </div>
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
          )}
        >
          {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(stat.change)}%
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {formatted}
          {stat.suffix}
        </p>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xs text-muted-foreground">{stat.sub}</p>
        <div className="h-10 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stat.data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stat.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stat.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={stat.color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
