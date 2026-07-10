'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReportsGrid } from './reports-grid'
import {
  ERP_DATA_CHANGED,
  formatDate,
  readSales,
  readSellers,
  type ErpSale,
  type ErpSeller,
} from '@/lib/erp/erp-store'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'

type SellerReportRow = {
  id: string
  name: string
  status: ErpSeller['status']
  salesCount: number
  returnCount: number
  revenue: number
  itemsQty: number
  averageCheck: number
  lastSaleAt: string | null
}

export function SellerReportsDashboard() {
  const [sellers, setSellers] = useState<ErpSeller[]>([])
  const [sales, setSales] = useState<ErpSale[]>([])

  useEffect(() => {
    const load = () => {
      setSellers(readSellers())
      setSales(readSales())
    }

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

  const rows = useMemo(() => buildSellerRows(sellers, sales), [sellers, sales])
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0)
  const totalSales = rows.reduce((sum, row) => sum + row.salesCount, 0)
  const bestSeller = [...rows].sort((left, right) => right.revenue - left.revenue)[0]

  const cards = useMemo(
    () => [
      {
        title: 'Продавцы',
        dot: 'green' as const,
        description: `Активных продавцов: ${sellers.length}. Продаж в отчете: ${totalSales}. Общая выручка: ${formatUZS(totalRevenue)} UZS.`,
      },
      {
        title: 'Лучший продавец',
        dot: 'blue' as const,
        description: bestSeller
          ? `${bestSeller.name}: ${formatUZS(bestSeller.revenue)} UZS, ${bestSeller.salesCount} продаж, средний чек ${formatUZS(Math.round(bestSeller.averageCheck))} UZS.`
          : 'Продаж пока нет. После первых чеков здесь появится лидер по выручке.',
      },
      {
        title: 'Продажи товаров',
        dot: 'teal' as const,
        description: `Всего продано ${rows.reduce((sum, row) => sum + row.itemsQty, 0)} ед. товара. Возвратов по продавцам: ${rows.reduce((sum, row) => sum + row.returnCount, 0)}.`,
      },
    ],
    [bestSeller, rows, sellers.length, totalRevenue, totalSales],
  )

  return (
    <div className="space-y-8">
      <ReportsGrid title="Отчеты по продавцам" cards={cards} />
      <SellerPerformanceTable rows={rows} />
      <SellerProductTable sales={sales.slice(0, 12)} />
    </div>
  )
}

function SellerPerformanceTable({ rows }: { rows: SellerReportRow[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Эффективность продавцов</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[1.3fr_130px_120px_120px_170px_130px_150px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Продавец</span>
            <span>Статус</span>
            <span>Продаж</span>
            <span>Возвратов</span>
            <span>Выручка</span>
            <span>Средний чек</span>
            <span>Последняя продажа</span>
          </div>
          {rows.length > 0 ? (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.3fr_130px_120px_120px_170px_130px_150px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="font-semibold text-primary">{row.name}</span>
                <span className="font-semibold text-foreground">{sellerStatusLabel(row.status)}</span>
                <span className="font-semibold text-foreground">{row.salesCount}</span>
                <span className="font-semibold text-foreground">{row.returnCount}</span>
                <span className="font-bold text-primary">{formatUZS(row.revenue)} UZS</span>
                <span className="font-semibold text-foreground">{formatUZS(Math.round(row.averageCheck))} UZS</span>
                <span className="text-muted-foreground">{row.lastSaleAt ? formatDate(row.lastSaleAt) : '-'}</span>
              </div>
            ))
          ) : (
            <EmptyState title="Продавцов пока нет" description="Добавьте сотрудников в управлении, чтобы отчет начал заполняться." />
          )}
        </div>
      </div>
    </section>
  )
}

function SellerProductTable({ sales }: { sales: ErpSale[] }) {
  const rows = sales.flatMap((sale) =>
    sale.lines.map((line) => ({
      id: `${sale.id}-${line.productId}`,
      date: sale.createdAt,
      seller: sale.seller,
      product: line.name,
      qty: line.qty,
      total: line.total,
      channel: sale.saleChannel === 'wholesale' ? 'Опт' : 'Розница',
    })),
  )

  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Последние продажи товаров</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[140px_1.2fr_1.5fr_100px_120px_150px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Дата</span>
            <span>Продавец</span>
            <span>Товар</span>
            <span>Кол-во</span>
            <span>Тип</span>
            <span>Сумма</span>
          </div>
          {rows.length > 0 ? (
            rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[140px_1.2fr_1.5fr_100px_120px_150px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="text-muted-foreground">{formatDate(row.date)}</span>
                <span className="truncate font-semibold text-primary">{row.seller}</span>
                <span className="truncate text-foreground">{row.product}</span>
                <span className="font-semibold text-foreground">{row.qty}</span>
                <span className="text-muted-foreground">{row.channel}</span>
                <span className="font-bold text-primary">{formatUZS(row.total)} UZS</span>
              </div>
            ))
          ) : (
            <EmptyState title="Продаж товаров пока нет" description="После продажи товаров здесь появится детализация по продавцам." />
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

function buildSellerRows(sellers: ErpSeller[], sales: ErpSale[]): SellerReportRow[] {
  const rows = new Map<string, SellerReportRow>()

  for (const seller of sellers) {
    rows.set(seller.name, {
      id: seller.id,
      name: seller.name,
      status: seller.status,
      salesCount: 0,
      returnCount: 0,
      revenue: 0,
      itemsQty: 0,
      averageCheck: 0,
      lastSaleAt: null,
    })
  }

  for (const sale of sales) {
    const row = rows.get(sale.seller) ?? {
      id: sale.seller,
      name: sale.seller,
      status: 'offline' as const,
      salesCount: 0,
      returnCount: 0,
      revenue: 0,
      itemsQty: 0,
      averageCheck: 0,
      lastSaleAt: null,
    }

    if (sale.type === 'return') {
      row.returnCount += 1
    } else {
      row.salesCount += 1
      row.revenue += sale.total
    }

    row.itemsQty += sale.lines.reduce((sum, line) => sum + line.qty, 0)
    if (!row.lastSaleAt || sale.createdAt > row.lastSaleAt) row.lastSaleAt = sale.createdAt
    rows.set(sale.seller, row)
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      averageCheck: row.salesCount > 0 ? row.revenue / row.salesCount : 0,
    }))
    .sort((left, right) => right.revenue - left.revenue)
}

function sellerStatusLabel(status: ErpSeller['status']) {
  if (status === 'online') return 'Онлайн'
  if (status === 'busy') return 'Занят'
  if (status === 'away') return 'Отошел'
  return 'Офлайн'
}
