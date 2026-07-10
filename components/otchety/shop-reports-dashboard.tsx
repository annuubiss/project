'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReportsGrid } from './reports-grid'
import {
  ERP_DATA_CHANGED,
  formatDateTime,
  getDashboardSummary,
  readFinanceTransactions,
  readSales,
  type DashboardSummary,
  type ErpFinanceTransaction,
  type ErpSale,
} from '@/lib/erp/erp-store'
import { PRODUCT_CATALOG_CHANGED, formatUZS, readProducts } from '@/lib/erp/product-catalog'

const emptySummary: DashboardSummary = {
  salesTotal: 0,
  paymentsTotal: 0,
  salesCount: 0,
  transactionCount: 0,
  soldQty: 0,
  stockValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  chartPoints: [],
  paymentSlices: [],
  latestTransactions: [],
}

export function ShopReportsDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [sales, setSales] = useState<ErpSale[]>([])
  const [transactions, setTransactions] = useState<ErpFinanceTransaction[]>([])

  useEffect(() => {
    const load = () => {
      setSummary(getDashboardSummary())
      setSales(readSales())
      setTransactions(readFinanceTransactions())
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

  const products = useMemo(() => readProducts(), [summary.stockValue])
  const averageCheck = sales.length > 0 ? summary.salesTotal / sales.length : 0
  const activeProducts = products.filter((product) => product.status === 'active').length

  const cards = useMemo(
    () => [
      {
        title: 'Сводный отчет',
        dot: 'blue' as const,
        description: `Продаж: ${summary.salesCount}. Выручка: ${formatUZS(summary.salesTotal)} UZS. Средний чек: ${formatUZS(Math.round(averageCheck))} UZS.`,
      },
      {
        title: 'Товары и остатки',
        dot: 'green' as const,
        description: `Активных товаров: ${activeProducts}. Стоимость остатка: ${formatUZS(summary.stockValue)} UZS. Заканчивается: ${summary.lowStockCount}, нет в наличии: ${summary.outOfStockCount}.`,
      },
      {
        title: 'Деньги и операции',
        dot: 'teal' as const,
        description: `Оплачено по продажам: ${formatUZS(summary.paymentsTotal)} UZS. Финансовых операций: ${summary.transactionCount}.`,
      },
    ],
    [activeProducts, averageCheck, summary],
  )

  return (
    <div className="space-y-8">
      <ReportsGrid title="Отчет по магазину" cards={cards} />
      <PaymentMethodTable rows={summary.paymentSlices} />
      <RecentSalesTable sales={sales.slice(0, 10)} />
      <RecentTransactionsTable transactions={transactions.slice(0, 10)} />
    </div>
  )
}

function PaymentMethodTable({ rows }: { rows: DashboardSummary['paymentSlices'] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Оплаты по способам</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1.6fr_180px_140px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Способ оплаты</span>
            <span>Сумма</span>
            <span>Доля</span>
          </div>
          {rows.length > 0 ? (
            rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.6fr_180px_140px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="font-semibold text-primary">{row.label}</span>
                <span className="font-bold text-primary">{formatUZS(row.amount)} UZS</span>
                <span className="font-semibold text-foreground">
                  {total > 0 ? Math.round((row.amount / total) * 100) : 0}%
                </span>
              </div>
            ))
          ) : (
            <EmptyState title="Оплат пока нет" description="После продаж здесь появится разбивка по способам оплаты." />
          )}
        </div>
      </div>
    </section>
  )
}

function RecentSalesTable({ sales }: { sales: ErpSale[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Последние продажи магазина</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[150px_130px_1.2fr_1.2fr_120px_150px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Дата</span>
            <span>Тип</span>
            <span>Клиент</span>
            <span>Продавец</span>
            <span>Товаров</span>
            <span>Сумма</span>
          </div>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="grid grid-cols-[150px_130px_1.2fr_1.2fr_120px_150px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="text-muted-foreground">{formatDateTime(sale.createdAt)}</span>
                <span className="font-semibold text-foreground">{saleTypeLabel(sale)}</span>
                <span className="truncate font-semibold text-primary">{sale.client || 'Без клиента'}</span>
                <span className="truncate text-muted-foreground">{sale.seller}</span>
                <span className="font-semibold text-foreground">{sale.lines.reduce((sum, line) => sum + line.qty, 0)}</span>
                <span className={sale.type === 'return' ? 'font-bold text-destructive' : 'font-bold text-primary'}>
                  {formatUZS(sale.total)} UZS
                </span>
              </div>
            ))
          ) : (
            <EmptyState title="Продаж пока нет" description="Когда продавец оформит продажу, она появится в отчете магазина." />
          )}
        </div>
      </div>
    </section>
  )
}

function RecentTransactionsTable({ transactions }: { transactions: ErpFinanceTransaction[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Последние денежные операции</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[170px_1.4fr_170px_160px_150px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Дата</span>
            <span>Операция</span>
            <span>Счет</span>
            <span>Метод</span>
            <span>Сумма</span>
          </div>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid grid-cols-[170px_1.4fr_170px_160px_150px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="text-muted-foreground">{formatDateTime(transaction.createdAt)}</span>
                <span className="truncate font-semibold text-primary">{transaction.operation}</span>
                <span className="truncate text-muted-foreground">{transaction.account}</span>
                <span className="truncate text-muted-foreground">{transaction.method}</span>
                <span className={transaction.amount < 0 ? 'font-bold text-destructive' : 'font-bold text-primary'}>
                  {transaction.amount > 0 ? '+' : ''}
                  {formatUZS(transaction.amount)} {transaction.currency}
                </span>
              </div>
            ))
          ) : (
            <EmptyState title="Операций пока нет" description="Финансовые движения появятся после продаж, расходов или переводов." />
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

function saleTypeLabel(sale: ErpSale) {
  if (sale.type === 'return') return 'Возврат'
  if (sale.type === 'exchange') return 'Обмен'
  return sale.saleChannel === 'wholesale' ? 'Опт' : 'Розница'
}
