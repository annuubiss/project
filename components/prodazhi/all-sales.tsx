'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowRight,
  Menu,
  Wallet,
  ArrowDownUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  formatDate,
  formatDateTime,
  readFinanceTransactions,
  readSales,
  type ErpFinanceTransaction,
  type ErpSale,
} from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'
import { exportCsv, exportDateStamp, exportExcel, exportJson } from '@/lib/erp/export'
import { queryItems, type SortConfig } from '@/lib/erp/storage'
import { FilterPanel, useFilters } from '@/components/ui/filter-panel'
import { DataPagination } from '@/components/ui/data-pagination'
import { ExportActions } from '@/components/ui/export-actions'
import { SaleDetailModal } from './sale-detail-modal'

type SaleCard = {
  id: string
  type: 'Продажа' | 'Опт' | 'Обмен' | 'Возврат'
  units: string
  datetime: string
  amount: string
  negative?: boolean
  store: string
  seller?: string
  source?: ErpSale
}

type SaleListRow = SaleCard & {
  createdAt: string
  createdDate: string
  client: string
  numericAmount: number
  numericUnits: number
}

type SortValue = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'date-desc', label: 'Сначала новые' },
  { value: 'date-asc', label: 'Сначала старые' },
  { value: 'amount-desc', label: 'Сумма по убыванию' },
  { value: 'amount-asc', label: 'Сумма по возрастанию' },
]

const FILTER_FIELDS = [
  {
    key: 'type',
    label: 'Тип продажи',
    type: 'select' as const,
    options: [
      { value: 'Продажа', label: 'Продажа' },
      { value: 'Опт', label: 'Опт' },
      { value: 'Возврат', label: 'Возврат' },
      { value: 'Обмен', label: 'Обмен' },
    ],
  },
  {
    key: 'store',
    label: 'Локация',
    type: 'select' as const,
    options: [
      { value: 'Магазин / Подвал', label: 'Магазин / Подвал' },
      { value: 'Склад №1', label: 'Склад №1' },
      { value: 'Склад №2', label: 'Склад №2' },
    ],
  },
  {
    key: 'seller',
    label: 'Продавец',
    type: 'text' as const,
  },
  {
    key: 'fromDate',
    label: 'Дата от',
    type: 'date-range' as const,
  },
  {
    key: 'toDate',
    label: 'Дата до',
    type: 'date-range' as const,
  },
]

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function AllSales() {
  const [expanded, setExpanded] = useState(true)
  const [selected, setSelected] = useState<SaleCard | null>(null)
  const [query, setQuery] = useState('')
  const [sortValue, setSortValue] = useState<SortValue>('date-desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [realSales, setRealSales] = useState<ErpSale[]>([])
  const [saleTransactions, setSaleTransactions] = useState<
    ErpFinanceTransaction[]
  >([])
  const filters = useFilters({
    type: '',
    store: '',
    seller: '',
    fromDate: '',
    toDate: '',
  })

  useEffect(() => {
    function load() {
      setRealSales(readSales())
      setSaleTransactions(
        readFinanceTransactions().filter(
          (transaction) => transaction.sourceType === 'sale',
        ),
      )
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [query, sortValue, pageSize, filters.values])

  const sales = useMemo(() => realSales.map(mapSaleRow), [realSales])

  const filteredRows = useMemo(() => {
    let list = sales

    if (filters.values.fromDate) {
      list = list.filter((sale) => sale.createdDate >= filters.values.fromDate)
    }

    if (filters.values.toDate) {
      list = list.filter((sale) => sale.createdDate <= filters.values.toDate)
    }

    return queryItems(list, {
      page: 1,
      pageSize: Math.max(list.length, 1),
      sort: resolveSort(sortValue),
      filters: {
        type: filters.values.type,
        store: filters.values.store,
        seller: filters.values.seller,
      },
      search: query,
      searchKeys: ['id', 'type', 'client', 'seller', 'store'],
    }).items
  }, [filters.values, query, sales, sortValue])

  const pagedSales = useMemo(
    () =>
      queryItems(filteredRows, {
        page,
        pageSize,
      }),
    [filteredRows, page, pageSize],
  )

  const report = useMemo(() => {
    const saleDocs = realSales.filter((sale) => sale.type === 'sale')
    const returnDocs = realSales.filter((sale) => sale.type === 'return')
    const exchangeDocs = realSales.filter((sale) => sale.type === 'exchange')
    const retailDocs = saleDocs.filter((sale) => sale.saleChannel !== 'wholesale')
    const wholesaleDocs = saleDocs.filter((sale) => sale.saleChannel === 'wholesale')

    const soldItems = saleDocs.reduce(
      (sum, sale) =>
        sum + sale.lines.reduce((lineSum, line) => lineSum + line.qty, 0),
      0,
    )
    const returnItems = returnDocs.reduce(
      (sum, sale) =>
        sum + sale.lines.reduce((lineSum, line) => lineSum + line.qty, 0),
      0,
    )
    const grossSales = saleDocs.reduce((sum, sale) => sum + sale.total, 0)
    const returnTotal = returnDocs.reduce(
      (sum, sale) => sum + Math.abs(sale.total),
      0,
    )
    const exchangeTotal = exchangeDocs.reduce(
      (sum, sale) => sum + Math.abs(sale.total),
      0,
    )

    const paymentTotals = new Map<string, number>()
    for (const transaction of saleTransactions) {
      paymentTotals.set(
        transaction.method,
        (paymentTotals.get(transaction.method) ?? 0) + transaction.amount,
      )
    }

    const paymentRows = Array.from(paymentTotals.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))

    const latestDate = realSales
      .map((sale) => new Date(sale.createdAt))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((left, right) => right.getTime() - left.getTime())[0]

    return {
      transactionCount: sales.length,
      soldItems,
      returnItems,
      retailDocsCount: retailDocs.length,
      wholesaleDocsCount: wholesaleDocs.length,
      returnDocsCount: returnDocs.length,
      exchangeDocsCount: exchangeDocs.length,
      returnTotal,
      exchangeTotal,
      grossSales,
      netTotal: grossSales - returnTotal,
      paymentRows,
      headerDate: latestDate
        ? formatDate(latestDate.toISOString())
        : '--.--.----',
    }
  }, [realSales, saleTransactions, sales.length])

  const exportRows = useMemo(
    () =>
      filteredRows.map((sale) => ({
        id: sale.id,
        date: sale.datetime,
        type: sale.type,
        client: sale.client || 'Гость',
        seller: sale.seller || '-',
        store: sale.store,
        units: sale.numericUnits,
        amount: sale.numericAmount,
        payments:
          sale.source?.payments.map((payment) => payment.label).join(', ') || '-',
      })),
    [filteredRows],
  )

  function handleExportCsv() {
    exportCsv(
      exportRows,
      [
        { header: 'ID', key: 'id' },
        { header: 'Дата', key: 'date' },
        { header: 'Тип', key: 'type' },
        { header: 'Клиент', key: 'client' },
        { header: 'Продавец', key: 'seller' },
        { header: 'Локация', key: 'store' },
        { header: 'Количество', key: 'units' },
        {
          header: 'Сумма',
          key: 'amount',
          format: (value) => `${formatUZS(Number(value) || 0)} UZS`,
        },
        { header: 'Оплата', key: 'payments' },
      ],
      `sales-${exportDateStamp()}`,
    )
  }

  function handleExportExcel() {
    exportExcel(
      exportRows,
      [
        { header: 'ID', key: 'id' },
        { header: 'Дата', key: 'date' },
        { header: 'Тип', key: 'type' },
        { header: 'Клиент', key: 'client' },
        { header: 'Продавец', key: 'seller' },
        { header: 'Локация', key: 'store' },
        { header: 'Количество', key: 'units' },
        {
          header: 'Сумма',
          key: 'amount',
          format: (value) => `${formatUZS(Number(value) || 0)} UZS`,
        },
        { header: 'Оплата', key: 'payments' },
      ],
      `sales-${exportDateStamp()}`,
      'Продажи',
    )
  }

  function handleExportJson() {
    exportJson(
      {
        generatedAt: new Date().toISOString(),
        filters: {
          query,
          ...filters.values,
          sort: sortValue,
        },
        total: filteredRows.length,
        sales: filteredRows.map((sale) => sale.source),
      },
      `sales-${exportDateStamp()}`,
    )
  }

  function handlePrint() {
    if (typeof window === 'undefined') return

    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) return

    const tableRows = filteredRows
      .map(
        (sale, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(sale.id)}</td>
            <td>${escapeHtml(sale.datetime)}</td>
            <td>${escapeHtml(sale.type)}</td>
            <td>${escapeHtml(sale.client || 'Гость')}</td>
            <td>${escapeHtml(sale.seller || '-')}</td>
            <td>${escapeHtml(sale.store)}</td>
            <td>${sale.numericUnits}</td>
            <td>${escapeHtml(formatUZS(sale.numericAmount))} UZS</td>
          </tr>`,
      )
      .join('')

    const activeFilters = [
      query ? `Поиск: ${query}` : '',
      filters.values.type ? `Тип: ${filters.values.type}` : '',
      filters.values.store ? `Локация: ${filters.values.store}` : '',
      filters.values.seller ? `Продавец: ${filters.values.seller}` : '',
      filters.values.fromDate ? `От: ${filters.values.fromDate}` : '',
      filters.values.toDate ? `До: ${filters.values.toDate}` : '',
    ]
      .filter(Boolean)
      .join(' | ')

    printWindow.document.write(`<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Отчет по продажам</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 24px;
        color: #111827;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 24px;
      }
      .meta {
        margin-bottom: 20px;
        font-size: 13px;
        color: #4b5563;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin: 0 0 20px;
      }
      .stat {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
      }
      .stat-label {
        font-size: 12px;
        color: #6b7280;
      }
      .stat-value {
        margin-top: 6px;
        font-size: 16px;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #e5e7eb;
        padding: 8px 10px;
        text-align: left;
        font-size: 12px;
      }
      th {
        background: #f9fafb;
      }
      .amount-negative {
        color: #dc2626;
        font-weight: 700;
      }
      .amount-positive {
        color: #111827;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <h1>Отчет по продажам</h1>
    <div class="meta">
      Сформирован: ${escapeHtml(formatDateTime(new Date().toISOString()))}<br />
      ${activeFilters ? `Фильтры: ${escapeHtml(activeFilters)}` : 'Фильтры: не заданы'}
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Записей</div>
        <div class="stat-value">${filteredRows.length}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Продажи</div>
        <div class="stat-value">${formatUZS(
          filteredRows
            .filter((sale) => sale.type !== 'Возврат')
            .reduce((sum, sale) => sum + Math.max(sale.numericAmount, 0), 0),
        )} UZS</div>
      </div>
      <div class="stat">
        <div class="stat-label">Возвраты</div>
        <div class="stat-value">${formatUZS(
          Math.abs(
            filteredRows
              .filter((sale) => sale.type === 'Возврат')
              .reduce((sum, sale) => sum + sale.numericAmount, 0),
          ),
        )} UZS</div>
      </div>
      <div class="stat">
        <div class="stat-label">Чистая сумма</div>
        <div class="stat-value">${formatUZS(
          filteredRows.reduce((sum, sale) => sum + sale.numericAmount, 0),
        )} UZS</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>ID</th>
          <th>Дата</th>
          <th>Тип</th>
          <th>Клиент</th>
          <th>Продавец</th>
          <th>Локация</th>
          <th>Кол-во</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Все продажи
            </h1>
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-[15px] font-bold text-muted-foreground">
              {filteredRows.length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border">
            <Calendar className="size-5 text-primary" />
            <span className="text-[15px] font-semibold text-foreground">
              {report.headerDate}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, транзакции, клиент, пользователь"
              className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <FilterPanel
            fields={FILTER_FIELDS}
            values={filters.values}
            onChange={filters.onChange}
            onReset={filters.onReset}
          />
          <div className="relative sm:w-[240px]">
            <ArrowDownUp className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value as SortValue)}
              className="h-14 w-full appearance-none rounded-2xl bg-card pl-11 pr-10 text-[15px] font-semibold text-foreground shadow-sm outline-none ring-1 ring-border transition-colors hover:bg-secondary focus:ring-2 focus:ring-primary/40"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="rounded-2xl bg-card px-4 py-2 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border">
            {report.headerDate}
          </span>
          <button
            onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? 'Свернуть' : 'Развернуть'}
            className="flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground"
          >
            {expanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          <div className="h-px flex-1 bg-border" />
        </div>

        {expanded && (
          <div className="space-y-4">
            {pagedSales.items.length > 0 ? (
              <div className="space-y-3">
                {pagedSales.items.map((sale, index) => (
                  <Link
                    key={`${sale.id}-${sale.datetime}-${index}`}
                    href={`/prodazhi/vse/${sale.id}`}
                    className="block rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex min-w-[72px] shrink-0 items-center justify-center rounded-2xl bg-secondary px-3 py-2 text-center text-[13px] font-bold text-muted-foreground">
                        {sale.units}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-foreground">
                          {sale.type} #{sale.id}
                        </p>
                        <p className="text-[14px] text-muted-foreground">
                          {sale.datetime}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p
                          className={cn(
                            'text-[15px] font-bold',
                            sale.negative ? 'text-destructive' : 'text-primary',
                          )}
                        >
                          {sale.amount}
                        </p>
                        <p className="flex items-center justify-end gap-1.5 text-[14px] text-muted-foreground">
                          <span className="size-2 rounded-full bg-primary" />
                          {sale.store}
                        </p>
                      </div>
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                        <ArrowRight className="size-4" />
                      </div>
                    </div>
                    {sale.seller && (
                      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                        <span className="rounded-full bg-secondary px-3 py-1.5 text-[13px] font-semibold text-muted-foreground">
                          {sale.seller}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-card px-6 py-12 text-center shadow-sm ring-1 ring-border">
                <h3 className="text-lg font-bold text-foreground">
                  Продажи не найдены
                </h3>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  Измените поиск или сбросьте фильтры, чтобы снова увидеть список.
                </p>
              </div>
            )}

            <DataPagination
              page={pagedSales.page}
              totalPages={pagedSales.totalPages}
              pageSize={pagedSales.pageSize}
              total={pagedSales.total}
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
        )}
      </div>

      <aside className="space-y-5">
        <button
          onClick={handlePrint}
          className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          Распечатать отчет
          <ArrowRight className="size-5" />
        </button>

        <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] text-muted-foreground">Транзакции</p>
              <p className="text-2xl font-black text-foreground">
                {report.transactionCount} шт
              </p>
            </div>
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              <Menu className="size-5" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5">
            <ReportRow label="Товары" value={`${report.soldItems} шт`} />
            <ReportRow label="Розница" value={`${report.retailDocsCount} шт`} />
            <ReportRow label="Опт" value={`${report.wholesaleDocsCount} шт`} />
            <ReportRow
              label="Возвраты"
              value={`${report.returnDocsCount} шт`}
            />
            <ReportRow
              label="Сумма возвратов"
              value={`-${formatUZS(report.returnTotal)} UZS`}
            />
            <ReportRow
              label="Обмены"
              value={`${report.exchangeDocsCount} шт`}
            />
            <ReportRow
              label="Сумма обменов"
              value={`${formatUZS(report.exchangeTotal)} UZS`}
            />
          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] text-muted-foreground">
                Сумма транзакций
              </p>
              <p className="text-2xl font-black text-primary">
                {formatUZS(report.grossSales)} UZS
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
            <ReportRow
              label="Чистая выручка"
              value={`${formatUZS(report.netTotal)} UZS`}
            />
            <ReportRow
              label="Возвращено товаров"
              value={`${report.returnItems} шт`}
            />
            {report.paymentRows.slice(0, 2).map((row) => (
              <ReportRow
                key={row.label}
                label={row.label}
                value={`${row.amount < 0 ? '-' : ''}${formatUZS(
                  Math.abs(row.amount),
                )} UZS`}
              />
            ))}
          </div>
        </div>
      </aside>

      <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function mapSaleRow(sale: ErpSale): SaleListRow {
  const units = sale.lines.reduce((sum, line) => sum + line.qty, 0)
  const isReturn = sale.type === 'return'
  const type = isReturn
    ? 'Возврат'
    : sale.saleChannel === 'wholesale'
      ? 'Опт'
      : sale.type === 'exchange'
        ? 'Обмен'
        : 'Продажа'

  return {
    id: sale.id,
    type,
    units: isReturn ? `0 (-${units}) ед` : `${units} ед`,
    datetime: formatDateTime(sale.createdAt),
    amount: `${formatUZS(sale.total)} UZS`,
    negative: sale.total < 0,
    store: sale.store,
    seller: sale.seller,
    source: sale,
    createdAt: sale.createdAt,
    createdDate: sale.createdAt.slice(0, 10),
    client: sale.client ?? '',
    numericAmount: sale.total,
    numericUnits: units,
  }
}

function resolveSort(value: SortValue): SortConfig<SaleListRow> {
  if (value === 'date-asc') {
    return { key: 'createdAt', dir: 'asc' }
  }
  if (value === 'amount-desc') {
    return { key: 'numericAmount', dir: 'desc' }
  }
  if (value === 'amount-asc') {
    return { key: 'numericAmount', dir: 'asc' }
  }
  return { key: 'createdAt', dir: 'desc' }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
