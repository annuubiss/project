'use client'

import { useEffect, useState } from 'react'
import { Warehouse } from 'lucide-react'
import {
  ERP_DATA_CHANGED,
  getProductMovementSummary,
  type ProductMovementSummary,
} from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'
import { useDashboardFeed } from './use-dashboard-feed'

const toneMap = {
  success: 'bg-success',
  primary: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const

const emptyMovementSummary: ProductMovementSummary = {
  productCount: 0,
  totalStock: 0,
  totalStockValue: 0,
  movementCount: 0,
  soldQty: 0,
  writeOffQty: 0,
  transferInQty: 0,
  transferOutQty: 0,
  adjustmentPlusQty: 0,
  adjustmentMinusQty: 0,
  latestMovements: [],
}

export function WarehouseCard() {
  const feed = useDashboardFeed()
  const [movementSummary, setMovementSummary] = useState<ProductMovementSummary>(emptyMovementSummary)
  const max = Math.max(...feed.warehouse.map((item) => item.value), 1)

  useEffect(() => {
    const reload = () => setMovementSummary(getProductMovementSummary())

    reload()
    window.addEventListener(ERP_DATA_CHANGED, reload)
    window.addEventListener('storage', reload)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, reload)
      window.removeEventListener('storage', reload)
    }
  }, [])

  return (
    <div className="animate-fade-up rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.1)] sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Состояние склада</h2>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Warehouse className="size-4" />
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {feed.warehouse.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${toneMap[item.tone]} transition-all duration-700`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Всего SKU</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {movementSummary.productCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Стоимость остатков</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {formatUZS(movementSummary.totalStockValue)} UZS
          </p>
        </div>
      </div>
    </div>
  )
}
