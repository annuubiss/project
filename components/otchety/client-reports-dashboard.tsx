'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReportsGrid } from './reports-grid'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  formatDate,
  getClientReportSummary,
  type ClientReportSummary,
  type ClientSummaryRow,
  type ErpSale,
} from '@/lib/erp/erp-store'

const emptySummary: ClientReportSummary = {
  clientCount: 0,
  buyersCount: 0,
  newClientsCount: 0,
  returningClientsCount: 0,
  clientSalesCount: 0,
  totalClientRevenue: 0,
  averageCheck: 0,
  averageRevenuePerClient: 0,
  topClients: [],
  latestClientSales: [],
}

export function ClientReportsDashboard() {
  const [summary, setSummary] = useState<ClientReportSummary>(emptySummary)

  useEffect(() => {
    const load = () => setSummary(getClientReportSummary())

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
        title: 'Клиенты',
        dot: 'yellow' as const,
        description: `Всего клиентов: ${summary.clientCount}. Покупали ${summary.buyersCount} клиентов, из них новых ${summary.newClientsCount}, возвращающихся ${summary.returningClientsCount}.`,
      },
      {
        title: 'Покупки клиентов',
        dot: 'green' as const,
        description: `Продаж с привязкой клиента: ${summary.clientSalesCount}. Выручка по клиентским продажам: ${formatUZS(summary.totalClientRevenue)} UZS.`,
      },
      {
        title: 'Средний чек',
        dot: 'blue' as const,
        description: `Средний чек: ${formatUZS(Math.round(summary.averageCheck))} UZS. Средняя выручка на клиента: ${formatUZS(Math.round(summary.averageRevenuePerClient))} UZS.`,
      },
    ],
    [summary],
  )

  return (
    <div className="space-y-8">
      <ReportsGrid title="Отчет по клиентам" cards={cards} />
      <TopClientsTable clients={summary.topClients} />
      <LatestClientSalesTable sales={summary.latestClientSales} />
    </div>
  )
}

function TopClientsTable({ clients }: { clients: ClientSummaryRow[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Топ клиентов</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.4fr_180px_150px_170px_170px_150px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Клиент</span>
            <span>Телефон</span>
            <span>Группа</span>
            <span>Покупок</span>
            <span>Сумма</span>
            <span>Последняя покупка</span>
          </div>
          {clients.length > 0 ? (
            clients.map((client) => (
              <div
                key={client.id}
                className="grid grid-cols-[1.4fr_180px_150px_170px_170px_150px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="font-semibold text-primary">{client.name}</span>
                <span className="text-muted-foreground">{client.phone}</span>
                <span className="font-semibold text-foreground">{client.group}</span>
                <span className="font-semibold text-foreground">{client.purchaseCount}</span>
                <span className="font-bold text-primary">{formatUZS(client.totalSpent)} UZS</span>
                <span className="text-muted-foreground">{client.lastPurchaseAt ? formatDate(client.lastPurchaseAt) : '-'}</span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Покупателей пока нет"
              description="Проведите продажи с привязкой клиента, чтобы отчет начал заполняться."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function LatestClientSalesTable({ sales }: { sales: ErpSale[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Последние покупки клиентов</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[140px_1.4fr_170px_130px_140px_150px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Дата</span>
            <span>Клиент</span>
            <span>Продавец</span>
            <span>Товаров</span>
            <span>Сумма</span>
            <span>Документ</span>
          </div>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="grid grid-cols-[140px_1.4fr_170px_130px_140px_150px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="text-muted-foreground">{formatDate(sale.createdAt)}</span>
                <span className="font-semibold text-primary">{sale.client}</span>
                <span className="text-muted-foreground">{sale.seller}</span>
                <span className="font-semibold text-foreground">{sale.lines.length}</span>
                <span className="font-bold text-primary">{formatUZS(sale.total)} UZS</span>
                <span className="font-semibold text-foreground">#{sale.id}</span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Покупок пока нет"
              description="После продаж с указанным клиентом здесь появится живая история покупок."
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
