'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  ChevronLeft,
  FileText,
  ImageIcon,
  Printer,
  RotateCcw,
  Wallet,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  formatDateTime,
  readSales,
  type ErpSale,
} from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'

export type SaleDetail = {
  id: string
  type: string
  units: string
  datetime: string
  amount: string
  negative?: boolean
  store: string
  seller?: string
  source?: ErpSale
}

type Tab = 'details' | 'payments' | 'links'

function fmt(value: number) {
  return `${formatUZS(value)} UZS`
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-[15px] text-muted-foreground">{label}</span>
      <span className="text-right text-[15px] font-semibold text-foreground">
        {value}
      </span>
    </div>
  )
}

function LinkedDocRow({
  sale,
  currentId,
}: {
  sale: ErpSale
  currentId: string
}) {
  const units = sale.lines.reduce((sum, line) => sum + line.qty, 0)
  const tone =
    sale.type === 'return'
      ? 'text-destructive'
      : sale.type === 'exchange'
        ? 'text-primary'
        : 'text-foreground'
  const label =
    sale.type === 'return'
      ? 'Возврат'
      : sale.type === 'exchange'
        ? 'Обмен'
        : sale.saleChannel === 'wholesale'
          ? 'Опт'
          : 'Продажа'

  return (
    <div
      className={cn(
        'rounded-2xl bg-secondary/60 px-4 py-3 ring-1 ring-transparent',
        sale.id === currentId && 'ring-primary/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-foreground">
            {label} #{sale.id}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {formatDateTime(sale.createdAt)} · {units} шт
          </p>
        </div>
        <span className={cn('shrink-0 text-[15px] font-black', tone)}>
          {fmt(sale.total)}
        </span>
      </div>
    </div>
  )
}

export function SaleDetailModal({
  sale,
  onClose,
}: {
  sale: SaleDetail | null
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('details')
  const [allSales, setAllSales] = useState<ErpSale[]>([])

  useEffect(() => {
    function load() {
      setAllSales(readSales())
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
    if (sale) setTab('details')
  }, [sale])

  const source = sale?.source
  const sourceRootId =
    source?.type === 'sale' ? source.id : source?.sourceSaleId ?? source?.id ?? null

  const sourceSale = useMemo(
    () =>
      sourceRootId
        ? allSales.find((item) => item.id === sourceRootId) ?? null
        : null,
    [allSales, sourceRootId],
  )

  const linkedSales = useMemo(() => {
    if (!sourceRootId) return []
    return allSales
      .filter((item) => item.id === sourceRootId || item.sourceSaleId === sourceRootId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  }, [allSales, sourceRootId])

  const relationSummary = useMemo(() => {
    const returns = linkedSales.filter((item) => item.type === 'return')
    const exchanges = linkedSales.filter((item) => item.type === 'exchange')
    const returnedQty = returns.reduce(
      (sum, item) =>
        sum + item.lines.reduce((lineSum, line) => lineSum + line.qty, 0),
      0,
    )
    const exchangedQty = exchanges.reduce(
      (sum, item) =>
        sum + item.lines.reduce((lineSum, line) => lineSum + line.qty, 0),
      0,
    )

    return {
      returnsCount: returns.length,
      exchangesCount: exchanges.length,
      returnedQty,
      exchangedQty,
      returnsTotal: returns.reduce((sum, item) => sum + Math.abs(item.total), 0),
      exchangeDelta: exchanges.reduce((sum, item) => sum + item.total, 0),
    }
  }, [linkedSales])

  if (!sale || !source) return null

  const total = Math.abs(source.total)
  const payments = source.payments
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const balance = source.total - paid
  const items = source.lines.map((line) => ({
    name: line.name,
    sku: line.sku,
    qty: line.qty,
    price: fmt(line.total),
  }))
  const operationType =
    source.type === 'return'
      ? 'Возврат'
      : source.type === 'exchange'
        ? 'Обмен'
        : source.saleChannel === 'wholesale'
          ? 'Оптовая'
          : 'Розничная'

  function printReceipt() {
    const receiptSource = source
    if (!receiptSource) return

    const printWindow = window.open('', '_blank', 'width=420,height=720')
    if (!printWindow) return

    const rows = receiptSource.lines
      .map(
        (line) => `
          <tr>
            <td>${line.name}</td>
            <td>${line.qty}</td>
            <td>${fmt(line.total)}</td>
          </tr>`,
      )
      .join('')

    printWindow.document.write(`<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Чек #${receiptSource.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      .meta { margin-bottom: 16px; font-size: 12px; color: #4b5563; }
      table { width: 100%; border-collapse: collapse; }
      td, th { border-bottom: 1px solid #e5e7eb; padding: 8px 0; font-size: 12px; text-align: left; }
      td:last-child, th:last-child { text-align: right; }
      .total { margin-top: 16px; display: flex; justify-content: space-between; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>${operationType} #${receiptSource.id}</h1>
    <div class="meta">
      ${formatDateTime(receiptSource.createdAt)}<br />
      ${receiptSource.store}<br />
      ${receiptSource.seller}
    </div>
    <table>
      <thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total"><span>Итого</span><span>${fmt(receiptSource.total)}</span></div>
  </body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-16 w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <button
            aria-label="Назад"
            onClick={onClose}
            className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            {operationType} #{source.id}
          </h2>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-secondary p-1.5">
          {[
            { id: 'details' as const, label: 'Детали' },
            { id: 'payments' as const, label: 'Оплата' },
            { id: 'links' as const, label: 'Связи' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-xl py-3 text-[15px] font-semibold transition-colors',
                tab === item.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'details' ? (
          <>
            <div className="mb-5 space-y-1 rounded-2xl bg-secondary/60 px-5 py-4">
              <DetailRow label="Дата и время" value={formatDateTime(source.createdAt)} />
              <DetailRow label="Магазин" value={source.store} />
              <DetailRow label="Продавец" value={source.seller} />
              <DetailRow label="Тип операции" value={operationType} />
              {source.client ? <DetailRow label="Клиент" value={source.client} /> : null}
              {sourceRootId && sourceRootId !== source.id ? (
                <DetailRow label="Исходная продажа" value={`#${sourceRootId}`} />
              ) : null}
            </div>

            <div className="mb-3 text-[15px] font-semibold text-foreground">
              Товары
            </div>
            <div className="mb-5 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.sku}-${item.qty}`}
                  className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="block text-[13px] text-muted-foreground">
                      {item.sku} · {item.qty} шт
                    </span>
                  </span>
                  <span className="text-[15px] font-bold text-primary">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 flex items-center justify-between border-t border-border pt-5">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <Wallet className="size-5 text-primary" />
                Итого
              </span>
              <span
                className={cn(
                  'text-xl font-black',
                  source.total < 0 ? 'text-destructive' : 'text-primary',
                )}
              >
                {fmt(source.total)}
              </span>
            </div>
          </>
        ) : null}

        {tab === 'payments' ? (
          <>
            <div className="mb-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-secondary/60 px-4 py-3 text-center">
                <p className="text-[13px] text-muted-foreground">Итого</p>
                <p className="text-[15px] font-bold text-foreground">
                  {fmt(total)}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 px-4 py-3 text-center">
                <p className="text-[13px] text-muted-foreground">Оплачено</p>
                <p className="text-[15px] font-bold text-foreground">
                  {fmt(paid)}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 px-4 py-3 text-center">
                <p className="text-[13px] text-muted-foreground">Разница</p>
                <p
                  className={cn(
                    'text-[15px] font-bold',
                    balance === 0 ? 'text-success' : 'text-destructive',
                  )}
                >
                  {fmt(balance)}
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
                      {payment.label}
                    </span>
                    <span className="text-[15px] font-bold text-primary">
                      {fmt(payment.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-secondary/60 px-4 py-5 text-center text-[15px] text-muted-foreground">
                  По этой операции нет отдельной оплаты.
                </div>
              )}
            </div>
          </>
        ) : null}

        {tab === 'links' ? (
          <>
            <div className="mb-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <RotateCcw className="size-4" />
                  Возвраты
                </p>
                <p className="mt-1 text-[15px] font-bold text-foreground">
                  {relationSummary.returnsCount} · {relationSummary.returnedQty} шт
                </p>
                <p className="mt-1 text-[13px] font-semibold text-destructive">
                  {fmt(relationSummary.returnsTotal)}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <ArrowLeftRight className="size-4" />
                  Обмены
                </p>
                <p className="mt-1 text-[15px] font-bold text-foreground">
                  {relationSummary.exchangesCount} · {relationSummary.exchangedQty} шт
                </p>
                <p className="mt-1 text-[13px] font-semibold text-primary">
                  {fmt(relationSummary.exchangeDelta)}
                </p>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <FileText className="size-4 text-primary" />
              История связанной продажи
            </div>
            <div className="mb-6 space-y-3">
              {sourceSale ? (
                linkedSales.map((item) => (
                  <LinkedDocRow key={item.id} sale={item} currentId={source.id} />
                ))
              ) : (
                <div className="rounded-2xl bg-secondary/60 px-4 py-5 text-center text-[15px] text-muted-foreground">
                  Связанные документы не найдены.
                </div>
              )}
            </div>
          </>
        ) : null}

        <button
          onClick={tab === 'details' ? printReceipt : onClose}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          {tab === 'details' ? (
            <>
              <Printer className="size-5" />
              Распечатать чек
            </>
          ) : (
            <>
              <X className="size-5" />
              Закрыть
            </>
          )}
        </button>
      </div>
    </div>
  )
}
