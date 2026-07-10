'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReportsGrid } from './reports-grid'
import {
  ERP_DATA_CHANGED,
  formatDateTime,
  getFinanceReportSummary,
  type ErpFinanceTransaction,
  type FinanceReportSummary,
  type FinanceReturnMethodBreakdown,
} from '@/lib/erp/erp-store'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'

const emptySummary: FinanceReportSummary = {
  incomeTotal: 0,
  expenseTotal: 0,
  netTotal: 0,
  salesIncomeTotal: 0,
  salesReturnTotal: 0,
  netSalesTotal: 0,
  retailSalesTotal: 0,
  wholesaleSalesTotal: 0,
  retailSalesCount: 0,
  wholesaleSalesCount: 0,
  returnSalesCount: 0,
  manualIncomeTotal: 0,
  transactionCount: 0,
  saleTransactionCount: 0,
  returnTransactionCount: 0,
  expenseTransactionCount: 0,
  methodBreakdown: [],
  returnMethodBreakdown: [],
  latestTransactions: [],
}

export function FinanceReportsDashboard() {
  const [summary, setSummary] = useState<FinanceReportSummary>(emptySummary)

  useEffect(() => {
    const load = () => setSummary(getFinanceReportSummary())

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
        title: 'Прибыль и убытки',
        dot: 'teal' as const,
        description: `Доходы: ${formatUZS(summary.incomeTotal)} UZS. Расходы: ${formatUZS(summary.expenseTotal)} UZS. Чистый результат: ${formatUZS(summary.netTotal)} UZS.`,
      },
      {
        title: 'Финансовые транзакции',
        dot: 'green' as const,
        description: `Всего операций: ${summary.transactionCount}. Продаж: ${summary.saleTransactionCount}, расходных операций: ${summary.expenseTransactionCount}.`,
      },
      {
        title: 'Продажи и возвраты',
        dot: 'blue' as const,
        description: `Продажи: ${formatUZS(summary.salesIncomeTotal)} UZS. Возвраты: ${formatUZS(summary.salesReturnTotal)} UZS. Чистая выручка: ${formatUZS(summary.netSalesTotal)} UZS.`,
      },
      {
        title: 'Розница и опт',
        dot: 'yellow' as const,
        description: `Розница: ${formatUZS(summary.retailSalesTotal)} UZS (${summary.retailSalesCount} чек.). Опт: ${formatUZS(summary.wholesaleSalesTotal)} UZS (${summary.wholesaleSalesCount} чек.). Возвратов: ${summary.returnSalesCount}.`,
      },
    ],
    [summary],
  )

  return (
    <div className="space-y-8">
      <ReportsGrid title="Отчет по финансам" cards={cards} />
      <FinanceMethodTable rows={summary.methodBreakdown} />
      <ReturnMethodTable rows={summary.returnMethodBreakdown} />
      <FinanceTransactionsTable transactions={summary.latestTransactions} />
    </div>
  )
}

function FinanceMethodTable({ rows }: { rows: FinanceReportSummary['methodBreakdown'] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Сводка по способам оплаты</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[780px]">
          <div className="grid grid-cols-[1.5fr_180px_180px_180px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Способ</span>
            <span>Доход</span>
            <span>Расход</span>
            <span>Оборот</span>
          </div>
          {rows.length > 0 ? (
            rows.map((row) => {
              const turnover = row.income + row.expense
              return (
                <div
                  key={row.method}
                  className="grid grid-cols-[1.5fr_180px_180px_180px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
                >
                  <span className="font-semibold text-primary">{row.method}</span>
                  <span className="font-bold text-primary">{formatUZS(row.income)} UZS</span>
                  <span className="font-bold text-destructive">{formatUZS(row.expense)} UZS</span>
                  <span className="font-semibold text-foreground">{formatUZS(turnover)} UZS</span>
                </div>
              )
            })
          ) : (
            <EmptyState
              title="Финансовых данных пока нет"
              description="Проведите продажу или добавьте доход/расход, чтобы отчет начал заполняться."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function ReturnMethodTable({ rows }: { rows: FinanceReturnMethodBreakdown[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Возвраты по способам оплаты</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1.6fr_180px_160px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Способ</span>
            <span>Возвратов</span>
            <span>Сумма</span>
          </div>
          {rows.length > 0 ? (
            rows.map((row) => (
              <div
                key={row.method}
                className="grid grid-cols-[1.6fr_180px_160px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="font-semibold text-primary">{row.method}</span>
                <span className="font-semibold text-foreground">{row.count}</span>
                <span className="font-bold text-destructive">{formatUZS(row.amount)} UZS</span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Возвратов пока нет"
              description="После оформленных возвратов здесь появится разбивка по способам оплаты."
            />
          )}
        </div>
      </div>
    </section>
  )
}

function FinanceTransactionsTable({ transactions }: { transactions: ErpFinanceTransaction[] }) {
  return (
    <section className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-xl font-black text-foreground">Последние финансовые операции</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[170px_1.4fr_130px_180px_150px_140px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Дата</span>
            <span>Операция</span>
            <span>Источник</span>
            <span>Счет</span>
            <span>Метод</span>
            <span>Сумма</span>
          </div>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid grid-cols-[170px_1.4fr_130px_180px_150px_140px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] last:border-b-0"
              >
                <span className="text-muted-foreground">{formatDateTime(transaction.createdAt)}</span>
                <span className="truncate font-semibold text-primary">{transaction.operation}</span>
                <span className="font-semibold text-foreground">{sourceTypeLabel(transaction)}</span>
                <span className="truncate text-muted-foreground">{transaction.account}</span>
                <span className="truncate text-muted-foreground">{transaction.method}</span>
                <span className={transaction.amount < 0 ? 'font-bold text-destructive' : 'font-bold text-primary'}>
                  {transaction.amount > 0 ? '+' : ''}
                  {formatUZS(transaction.amount)} UZS
                </span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Операций пока нет"
              description="После продаж и ручных финансовых операций здесь появится история движения денег."
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

function sourceTypeLabel(transaction: ErpFinanceTransaction) {
  if (transaction.sourceType === 'sale') {
    if (transaction.operation.toLowerCase().includes('обмен')) return 'Обмен'
    return transaction.amount < 0 ? 'Возврат продажи' : 'Продажа'
  }
  if (transaction.sourceType === 'income') return 'Доход'
  if (transaction.sourceType === 'expense') return 'Расход'
  if (transaction.sourceType === 'supplier_payment') return 'Оплата поставщику'
  if (transaction.sourceType === 'transfer') return 'Перемещение денег'
  if (transaction.sourceType === 'conversion') return 'Конвертация'
  return 'Финансовая операция'
}
