'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReportsGrid } from './reports-grid'
import {
  ERP_DATA_CHANGED,
  formatDateTime,
  getProductMovementSummary,
  type ErpInventoryMovement,
  type ProductMovementSummary,
} from '@/lib/erp/erp-store'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'

const emptySummary: ProductMovementSummary = {
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

export function ProductReportsDashboard() {
  const [summary, setSummary] = useState<ProductMovementSummary>(emptySummary)

  useEffect(() => {
    const load = () => setSummary(getProductMovementSummary())

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const cards = useMemo(
    () => [
      {
        title: 'Продажи по товарам',
        dot: 'blue' as const,
        description: `Продано ${summary.soldQty} ед. по данным реальных продаж. Отчет обновляется после оплаты в POS.`,
      },
      {
        title: 'Эффективность товаров',
        dot: 'purple' as const,
        description: `В системе ${summary.productCount} товаров, общий остаток ${summary.totalStock} ед. на сумму ${formatUZS(summary.totalStockValue)} UZS.`,
      },
      {
        title: 'Движения товаров',
        dot: 'green' as const,
        description: `Всего движений: ${summary.movementCount}. Продажи, списания, перемещения и инвентаризация читаются из одного журнала.`,
      },
      {
        title: 'Списания',
        dot: 'yellow' as const,
        description: `Списано ${summary.writeOffQty} ед. через раздел списания. Эти операции уже уменьшают складские остатки.`,
      },
      {
        title: 'Перемещения',
        dot: 'teal' as const,
        description: `Приход по перемещениям: ${summary.transferInQty} ед., расход по перемещениям: ${summary.transferOutQty} ед.`,
      },
      {
        title: 'Инвентаризация',
        dot: 'purple' as const,
        description: `Излишки: ${summary.adjustmentPlusQty} ед., недостачи: ${summary.adjustmentMinusQty} ед. по завершенным корректировкам.`,
      },
    ],
    [summary],
  )

  return (
    <div className="space-y-8">
      <ReportsGrid title="Отчет по товарам" cards={cards} />
      <MovementTable movements={summary.latestMovements} />
    </div>
  )
}

function MovementTable({ movements }: { movements: ErpInventoryMovement[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Последние движения товаров</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[150px_1.4fr_150px_150px_110px_110px_1fr] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Дата</span>
            <span>Товар</span>
            <span>Тип</span>
            <span>Склад</span>
            <span>Кол-во</span>
            <span>Остаток</span>
            <span>Источник</span>
          </div>
          {movements.length > 0 ? (
            movements.map((movement) => (
              <div
                key={movement.id}
                className="grid grid-cols-[150px_1.4fr_150px_150px_110px_110px_1fr] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="text-muted-foreground">{formatDateTime(movement.createdAt)}</span>
                <span className="truncate font-semibold text-primary">{movement.productName}</span>
                <span className="font-semibold text-foreground">{movementTypeLabel(movement.type)}</span>
                <span className="truncate text-muted-foreground">{movement.warehouseName}</span>
                <span className={movement.qty < 0 ? 'font-bold text-destructive' : 'font-bold text-primary'}>
                  {movement.qty > 0 ? '+' : ''}
                  {movement.qty}
                </span>
                <span className="font-semibold text-foreground">{movement.afterQty}</span>
                <span className="truncate text-muted-foreground">{movement.reason ?? movement.sourceId ?? '-'}</span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Движений пока нет"
              description="Проведите продажу, списание, перемещение или инвентаризацию."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>
    </div>
  )
}

function movementTypeLabel(type: ErpInventoryMovement['type']) {
  if (type === 'sale') return 'Продажа'
  if (type === 'sale_return') return 'Возврат'
  if (type === 'writeoff') return 'Списание'
  if (type === 'transfer_in') return 'Приход'
  if (type === 'transfer_out') return 'Расход'
  if (type === 'supplier_return') return 'Возврат поставщику'
  if (type === 'inventory_adjustment') return 'Инвентаризация'
  return 'Ручная операция'
}
