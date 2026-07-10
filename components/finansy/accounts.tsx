'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Wallet,
  CreditCard,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  formatDateTime,
  getFinanceAccountDetails,
  getFinanceAccountsSummary,
  type FinanceAccountDetails,
  type FinanceAccountsSummary,
} from '@/lib/erp/erp-store'
import { exportCsv, exportDateStamp, exportExcel, exportJson } from '@/lib/erp/export'
import { queryItems } from '@/lib/erp/storage'
import { DataPagination } from '@/components/ui/data-pagination'
import { ExportActions } from '@/components/ui/export-actions'

const emptySummary: FinanceAccountsSummary = {
  totalCash: 0,
  totalCashless: 0,
  rows: [],
}

type AccountExportRow = {
  account: string
  cashBalance: number
  cashlessBalance: number
  cashFrozen: number
  cashlessFrozen: number
  turnoverIn: number
  turnoverOut: number
  transactions: number
  lastActivity: string
}

export function FinanceAccounts() {
  const [query, setQuery] = useState('')
  const [showStats, setShowStats] = useState(true)
  const [expanded, setExpanded] = useState<string[]>([])
  const [summary, setSummary] = useState<FinanceAccountsSummary>(emptySummary)
  const [details, setDetails] = useState<Record<string, FinanceAccountDetails>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  useEffect(() => {
    function load() {
      const nextSummary = getFinanceAccountsSummary()
      const nextDetails = Object.fromEntries(
        nextSummary.rows
          .map((row) => [row.id, getFinanceAccountDetails(row.id)])
          .filter((entry): entry is [string, FinanceAccountDetails] => Boolean(entry[1])),
      )

      setSummary(nextSummary)
      setDetails(nextDetails)
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

  useEffect(() => {
    setPage(1)
  }, [query, pageSize])

  const filtered = useMemo(
    () =>
      summary.rows.filter((row) =>
        row.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, summary.rows],
  )

  const paged = useMemo(
    () =>
      queryItems(filtered, {
        page,
        pageSize,
      }),
    [filtered, page, pageSize],
  )

  const exportRows = useMemo<AccountExportRow[]>(
    () =>
      filtered.map((row) => {
        const detail = details[row.id]
        return {
          account: row.name,
          cashBalance: row.cash.balance,
          cashlessBalance: row.cashless.balance,
          cashFrozen: row.cash.frozen,
          cashlessFrozen: row.cashless.frozen,
          turnoverIn: detail?.turnoverIn ?? 0,
          turnoverOut: detail?.turnoverOut ?? 0,
          transactions: detail?.transactionCount ?? 0,
          lastActivity: detail?.lastActivityAt ? formatDateTime(detail.lastActivityAt) : '-',
        }
      }),
    [details, filtered],
  )

  function toggle(id: string) {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  function handleExportCsv() {
    exportCsv(
      exportRows,
      [
        { header: 'Счет', key: 'account' },
        { header: 'Наличные', key: 'cashBalance', format: formatExportMoney },
        { header: 'Безналичные', key: 'cashlessBalance', format: formatExportMoney },
        { header: 'Заморожено наличные', key: 'cashFrozen', format: formatExportMoney },
        { header: 'Заморожено безналичные', key: 'cashlessFrozen', format: formatExportMoney },
        { header: 'Поступления', key: 'turnoverIn', format: formatExportMoney },
        { header: 'Списания', key: 'turnoverOut', format: formatExportMoney },
        { header: 'Операций', key: 'transactions' },
        { header: 'Последняя активность', key: 'lastActivity' },
      ],
      `finance-accounts-${exportDateStamp()}`,
    )
  }

  function handleExportExcel() {
    exportExcel(
      exportRows,
      [
        { header: 'Счет', key: 'account' },
        { header: 'Наличные', key: 'cashBalance', format: formatExportMoney },
        { header: 'Безналичные', key: 'cashlessBalance', format: formatExportMoney },
        { header: 'Заморожено наличные', key: 'cashFrozen', format: formatExportMoney },
        { header: 'Заморожено безналичные', key: 'cashlessFrozen', format: formatExportMoney },
        { header: 'Поступления', key: 'turnoverIn', format: formatExportMoney },
        { header: 'Списания', key: 'turnoverOut', format: formatExportMoney },
        { header: 'Операций', key: 'transactions' },
        { header: 'Последняя активность', key: 'lastActivity' },
      ],
      `finance-accounts-${exportDateStamp()}`,
      'Счета',
    )
  }

  function handleExportJson() {
    exportJson(
      {
        generatedAt: new Date().toISOString(),
        total: filtered.length,
        accounts: exportRows,
      },
      `finance-accounts-${exportDateStamp()}`,
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-[34px]">
          Состояние счетов
        </h1>
        <button
          onClick={() => setShowStats((value) => !value)}
          className="flex items-center gap-1.5 text-[15px] font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {showStats ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {showStats ? 'Скрыть статистику' : 'Показать статистику'}
        </button>
      </div>

      {showStats ? (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">Сумма наличных</h2>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Banknote className="size-5" />
              </span>
            </div>
            <div className="mt-5 border-t border-border pt-5 text-[26px] font-black tracking-tight">
              <span className="text-primary">{formatMoney(summary.totalCash)} UZS</span>
              <span className="text-muted-foreground"> / 0 USD</span>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">Сумма безналичных</h2>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </span>
            </div>
            <div className="mt-5 border-t border-border pt-5 text-[26px] font-black tracking-tight">
              <span className="text-primary">{formatMoney(summary.totalCashless)} UZS</span>
              <span className="text-muted-foreground"> / 0 USD</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Магазин, касса"
            className="h-14 w-full rounded-2xl bg-card pl-12 pr-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setQuery('')}
          className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-card px-7 text-[15px] font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Filter className="size-4 text-primary" />
          Фильтры
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Магазин</span>
          <span>Баланс</span>
          <span>Заморожено</span>
        </div>

        {paged.items.length > 0 ? (
          paged.items.map((row) => {
            const detail = details[row.id]
            return (
              <div key={row.id}>
                <div className="grid grid-cols-[1.4fr_1fr_1fr] items-start gap-4 border-b border-border px-6 py-5 transition-colors hover:bg-secondary/40">
                  <button
                    onClick={() => toggle(row.id)}
                    className="flex items-center gap-2 text-left text-[15px] font-semibold text-foreground"
                  >
                    <ChevronRight
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform',
                        expanded.includes(row.id) && 'rotate-90',
                      )}
                    />
                    {row.name}
                  </button>

                  <div className="space-y-1.5">
                    <p className="flex items-center gap-2 text-[14px]">
                      <Wallet className="size-4 text-primary" />
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          row.cash.balance < 0 ? 'text-destructive' : 'text-foreground',
                        )}
                      >
                        {formatMoney(row.cash.balance)} UZS / 0 USD
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-[14px]">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          row.cashless.balance < 0 ? 'text-destructive' : 'text-foreground',
                        )}
                      >
                        {formatMoney(row.cashless.balance)} UZS / 0 USD
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[14px] text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Wallet className="size-4" />
                      <span className="tabular-nums">
                        {formatMoney(row.cash.frozen)} UZS / 0 USD
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CreditCard className="size-4" />
                      <span className="tabular-nums">
                        {formatMoney(row.cashless.frozen)} UZS / 0 USD
                      </span>
                    </p>
                  </div>
                </div>

                {expanded.includes(row.id) ? (
                  <div className="border-b border-border bg-secondary/30 px-6 py-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        { label: 'Касса (наличные)', value: `${formatMoney(row.cash.balance)} UZS` },
                        {
                          label: 'Касса (безналичные)',
                          value: `${formatMoney(row.cashless.balance)} UZS`,
                        },
                        { label: 'Поступления', value: `${formatMoney(detail?.turnoverIn ?? 0)} UZS` },
                        { label: 'Списания', value: `${formatMoney(detail?.turnoverOut ?? 0)} UZS` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                          <p className="text-[12px] text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-[15px] font-bold text-foreground tabular-nums">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
                      <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
                        <h3 className="text-[14px] font-bold text-foreground">Сводка по счету</h3>
                        <div className="mt-4 space-y-3 text-[13px]">
                          <p className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Операций</span>
                            <span className="font-semibold text-foreground">
                              {detail?.transactionCount ?? 0}
                            </span>
                          </p>
                          <p className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Последняя активность</span>
                            <span className="text-right font-semibold text-foreground">
                              {detail?.lastActivityAt ? formatDateTime(detail.lastActivityAt) : '-'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                        <div className="grid grid-cols-[140px_1fr_140px_120px] gap-4 border-b border-border px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <span>Дата</span>
                          <span>Операция</span>
                          <span>Сумма</span>
                          <span>Канал</span>
                        </div>
                        {detail && detail.activities.length > 0 ? (
                          detail.activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="grid grid-cols-[140px_1fr_140px_120px] items-center gap-4 border-b border-border px-4 py-3 text-[13px] last:border-b-0"
                            >
                              <span className="text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock3 className="size-3.5" />
                                  {formatDateTime(activity.createdAt)}
                                </span>
                              </span>
                              <div>
                                <p className="font-semibold text-foreground">{activity.operation}</p>
                                <p className="text-muted-foreground">{activity.method}</p>
                              </div>
                              <span>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-bold tabular-nums',
                                    activity.amount >= 0
                                      ? 'bg-chart-2/15 text-chart-2'
                                      : 'bg-destructive/10 text-destructive',
                                  )}
                                >
                                  {activity.amount >= 0 ? (
                                    <ArrowDownLeft className="size-3.5" />
                                  ) : (
                                    <ArrowUpRight className="size-3.5" />
                                  )}
                                  {formatMoney(activity.amount)} {activity.currency}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                {activity.channel === 'cash' ? 'Наличные' : 'Безналичные'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-[14px] text-muted-foreground">
                            По счету пока нет операций
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <h2 className="text-xl font-bold text-foreground">Счета пока пусты</h2>
            <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
              После продаж и финансовых операций здесь появятся реальные остатки по кассе
              и безналу.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <DataPagination
          page={paged.page}
          totalPages={paged.totalPages}
          pageSize={paged.pageSize}
          total={paged.total}
          onPage={setPage}
          onPageSize={setPageSize}
          exportButton={
            <ExportActions
              onCsv={handleExportCsv}
              onExcel={handleExportExcel}
              onJson={handleExportJson}
            />
          }
        />
      </div>
    </>
  )
}

function formatMoney(value: number) {
  const sign = value < 0 ? '-' : ''
  return `${sign}${formatUZS(Math.abs(value))}`
}

function formatExportMoney(value: unknown) {
  return `${formatMoney(Number(value) || 0)} UZS`
}
