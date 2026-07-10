'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  Search,
  ScanLine,
  ArrowRight,
  RotateCcw,
  ArrowLeftRight,
} from 'lucide-react'
import {
  createSaleExchange,
  createSaleReturn,
  ERP_DATA_CHANGED,
  formatDateTime,
  getActivePosPaymentMethods,
  readSales,
  type ErpSale,
} from '@/lib/erp/erp-store'
import { formatUZS, type CatalogProduct } from '@/lib/erp/product-catalog'

type ReturnLineDraft = Record<string, string>

export type ExchangeCartDraft = {
  orderNumber: string
  client: string | null
  seller: string
  wholesale: boolean
  subtotal: number
  discount: number
  total: number
  note: string
  lines: Array<{
    product: CatalogProduct
    qty: number
  }>
}

export function ExchangeModal({
  open,
  onClose,
  exchangeDraft,
  onReturned,
  onExchanged,
}: {
  open: boolean
  onClose: () => void
  exchangeDraft?: ExchangeCartDraft | null
  onReturned?: (saleReturn: ErpSale) => void
  onExchanged?: (result: { saleReturn: ErpSale; exchangeSale: ErpSale }) => void
}) {
  const [query, setQuery] = useState('')
  const [sales, setSales] = useState<ErpSale[]>([])
  const [selectedSale, setSelectedSale] = useState<ErpSale | null>(null)
  const [returnQty, setReturnQty] = useState<ReturnLineDraft>({})
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [settlementMethodId, setSettlementMethodId] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return

    function load() {
      setSales(readSales())
    }

    const methods = getActivePosPaymentMethods().filter(
      (method) => method.allowInPos && method.status === 'active',
    )
    setSettlementMethodId(methods[0]?.id ?? '')

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [open])

  const paymentMethods = useMemo(
    () =>
      getActivePosPaymentMethods().filter(
        (method) => method.allowInPos && method.status === 'active',
      ),
    [open],
  )

  const returnedBySale = useMemo(() => {
    const result = new Map<string, Map<string, number>>()

    for (const sale of sales) {
      if (sale.type !== 'return' || !sale.sourceSaleId) continue
      const saleMap = result.get(sale.sourceSaleId) ?? new Map<string, number>()
      for (const line of sale.lines) {
        saleMap.set(line.productId, (saleMap.get(line.productId) ?? 0) + line.qty)
      }
      result.set(sale.sourceSaleId, saleMap)
    }

    return result
  }, [sales])

  const saleRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return sales
      .filter((sale) => sale.type === 'sale')
      .filter((sale) => {
        if (!normalized) return true
        return [
          sale.id,
          sale.client ?? '',
          sale.seller,
          ...sale.lines.flatMap((line) => [line.name, line.sku, line.barcode]),
        ].some((value) => value.toLowerCase().includes(normalized))
      })
      .slice(0, 20)
  }, [query, sales])

  const selectedReturned = selectedSale
    ? returnedBySale.get(selectedSale.id) ?? new Map<string, number>()
    : new Map<string, number>()

  const returnTotal = selectedSale
    ? selectedSale.lines.reduce((sum, line) => {
        const qty = Math.max(0, Math.floor(Number(returnQty[line.productId]) || 0))
        return sum + qty * line.unitPrice
      }, 0)
    : 0

  const exchangeEnabled = Boolean(exchangeDraft && exchangeDraft!.lines.length > 0)
  const exchangeTotal = exchangeDraft?.total ?? 0
  const settlementDelta = exchangeEnabled ? exchangeTotal - returnTotal : 0
  const settlementMethod =
    paymentMethods.find((method) => method.id === settlementMethodId) ?? paymentMethods[0]

  function pickSale(sale: ErpSale) {
    const returned = returnedBySale.get(sale.id) ?? new Map<string, number>()
    setSelectedSale(sale)
    setReturnQty(
      Object.fromEntries(
        sale.lines.map((line) => [
          line.productId,
          String(Math.max(0, line.qty - (returned.get(line.productId) ?? 0))),
        ]),
      ),
    )
    setReason('')
    setError('')
  }

  function buildReturnLines() {
    if (!selectedSale) return []
    return selectedSale.lines.map((line) => ({
      productId: line.productId,
      qty: Math.max(0, Math.floor(Number(returnQty[line.productId]) || 0)),
    }))
  }

  function submitReturn() {
    if (!selectedSale) return
    setError('')

    try {
      const saleReturn = createSaleReturn({
        saleId: selectedSale.id,
        reason,
        lines: buildReturnLines(),
      })
      onReturned?.(saleReturn)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось оформить возврат.',
      )
    }
  }

  function submitExchange() {
    if (!selectedSale || !exchangeDraft) return
    setError('')

    try {
      if (settlementDelta !== 0 && !settlementMethod) {
        throw new Error('Выберите способ расчета по обмену.')
      }

      const result = createSaleExchange({
        saleId: selectedSale.id,
        seller: exchangeDraft!.seller,
        reason,
        returnLines: buildReturnLines(),
        exchange: {
          orderNumber: exchangeDraft!.orderNumber,
          client: exchangeDraft!.client,
          seller: exchangeDraft!.seller,
          saleChannel: exchangeDraft!.wholesale ? 'wholesale' : 'retail',
          subtotal: exchangeDraft!.subtotal,
          discount: exchangeDraft!.discount,
          total: settlementDelta,
          lines: exchangeDraft!.lines.map((line) => ({
            product: line.product,
            qty: line.qty,
            unitPrice: exchangeDraft!.wholesale
              ? line.product.wholesalePrice || line.product.price
              : line.product.price,
            priceType: exchangeDraft!.wholesale ? 'wholesale' : 'retail',
          })),
          payments:
            settlementDelta === 0 || !settlementMethod
              ? []
              : [
                  {
                    id: `${settlementMethod.id}-${Date.now()}`,
                    methodId: settlementMethod.id,
                    label: settlementMethod.label,
                    amount: Math.abs(settlementDelta),
                  },
                ],
          note: exchangeDraft!.note,
        },
      })
      onExchanged?.(result)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось оформить обмен.',
      )
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-16 w-full max-w-3xl rounded-3xl bg-card p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <button
            aria-label="Назад"
            onClick={selectedSale ? () => setSelectedSale(null) : onClose}
            className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            {selectedSale
              ? `${exchangeEnabled ? 'Обмен' : 'Возврат'} #${selectedSale.id}`
              : 'Возврат / Обмен'}
          </h2>
        </div>

        {!selectedSale ? (
          <>
            <div className="mb-5 rounded-2xl bg-secondary/60 px-5 py-4 text-center text-[15px] text-muted-foreground">
              Найдите продажу по номеру чека, клиенту, товару или отсканируйте чек
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Номер чека, клиент, товар"
                  className="h-13 w-full rounded-2xl bg-secondary py-4 pl-12 pr-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <button
                aria-label="Сканировать чек"
                onClick={() => {
                  searchInputRef.current?.focus()
                  searchInputRef.current?.select()
                }}
                className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-primary p-4 text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                <ScanLine className="size-5" />
              </button>
            </div>

            <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              {saleRows.map((sale) => {
                const units = sale.lines.reduce((sum, line) => sum + line.qty, 0)
                const returned = returnedBySale.get(sale.id)
                const returnedQty = returned
                  ? Array.from(returned.values()).reduce((sum, qty) => sum + qty, 0)
                  : 0
                const fullyReturned = returnedQty >= units

                return (
                  <button
                    key={sale.id}
                    disabled={fullyReturned}
                    onClick={() => pickSale(sale)}
                    className="flex w-full items-center gap-4 rounded-2xl bg-secondary/60 px-5 py-4 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex min-w-[64px] shrink-0 items-center justify-center rounded-xl bg-card px-3 py-2 text-center text-[13px] font-bold text-muted-foreground">
                      {units - returnedQty} ед
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-foreground">
                        Продажа #{sale.id}
                      </span>
                      <span className="block text-[14px] text-muted-foreground">
                        {formatDateTime(sale.createdAt)}
                      </span>
                    </span>
                    <span className="text-[15px] font-bold text-primary">
                      {formatUZS(sale.total)} UZS
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </button>
                )
              })}
              {saleRows.length === 0 && (
                <p className="py-8 text-center text-[15px] text-muted-foreground">
                  Продажа не найдена
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {error ? (
              <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
                {error}
              </div>
            ) : null}

            <div className="rounded-2xl bg-secondary/60 px-5 py-4 text-[15px] text-muted-foreground">
              {exchangeEnabled
                ? 'Обмен вернет выбранные товары на остаток и сразу спишет новые товары из текущей корзины.'
                : 'Возврат вернет товар на остаток Магазин / Подвал и создаст расход по оплате.'}
            </div>

            <div className="space-y-3">
              {selectedSale.lines.map((line) => {
                const returned = selectedReturned.get(line.productId) ?? 0
                const available = Math.max(0, line.qty - returned)

                return (
                  <div
                    key={line.productId}
                    className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-foreground">
                        {line.name}
                      </span>
                      <span className="block text-[13px] text-muted-foreground">
                        {line.sku} · доступно к возврату {available} шт
                      </span>
                    </span>
                    <input
                      inputMode="numeric"
                      value={returnQty[line.productId] ?? '0'}
                      onChange={(event) => {
                        const value = Math.min(
                          available,
                          Math.max(
                            0,
                            Math.floor(
                              Number(event.target.value.replace(/\D/g, '')) || 0,
                            ),
                          ),
                        )
                        setReturnQty((current) => ({
                          ...current,
                          [line.productId]: String(value),
                        }))
                      }}
                      className="h-11 w-24 rounded-xl bg-card px-3 text-center text-[15px] font-bold text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                    />
                    <span className="w-32 text-right text-[15px] font-bold text-primary">
                      {formatUZS(line.unitPrice)} UZS
                    </span>
                  </div>
                )
              })}
            </div>

            {exchangeEnabled ? (
              <div className="rounded-2xl bg-card px-5 py-4 ring-1 ring-border">
                <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
                  <ArrowLeftRight className="size-4 text-primary" />
                  Товары на выдачу
                </div>
                <div className="space-y-3">
                  {exchangeDraft!.lines.map((line) => (
                    <div
                      key={line.product.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-foreground">
                          {line.product.name}
                        </span>
                        <span className="block text-[13px] text-muted-foreground">
                          {line.product.sku} · {line.qty} шт
                        </span>
                      </span>
                      <span className="text-[15px] font-bold text-primary">
                        {formatUZS(
                          line.qty *
                            (exchangeDraft!.wholesale
                              ? line.product.wholesalePrice || line.product.price
                              : line.product.price),
                        )}{' '}
                        UZS
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                    <p className="text-[13px] text-muted-foreground">Возврат</p>
                    <p className="mt-1 text-[15px] font-bold text-foreground">
                      {formatUZS(returnTotal)} UZS
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                    <p className="text-[13px] text-muted-foreground">Новые товары</p>
                    <p className="mt-1 text-[15px] font-bold text-foreground">
                      {formatUZS(exchangeTotal)} UZS
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                    <p className="text-[13px] text-muted-foreground">Разница</p>
                    <p className="mt-1 text-[15px] font-bold text-primary">
                      {settlementDelta > 0 ? '+' : settlementDelta < 0 ? '-' : ''}
                      {formatUZS(Math.abs(settlementDelta))} UZS
                    </p>
                  </div>
                </div>

                {settlementDelta !== 0 ? (
                  <div className="mt-4 space-y-2">
                    <label className="text-[13px] font-medium text-muted-foreground">
                      Способ расчета
                    </label>
                    <div className="relative">
                      <select
                        value={settlementMethodId}
                        onChange={(event) => setSettlementMethodId(event.target.value)}
                        className="h-11 w-full appearance-none rounded-xl bg-secondary px-4 pr-9 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
                      >
                        {paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                      <ChevronLeft className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-[-90deg] text-muted-foreground" />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Причина возврата или обмена"
              rows={3}
              className="w-full resize-none rounded-2xl bg-secondary px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />

            <button
              onClick={exchangeEnabled ? submitExchange : submitReturn}
              disabled={
                returnTotal <= 0 ||
                (exchangeEnabled && exchangeDraft!.lines.length === 0)
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exchangeEnabled ? (
                <>
                  <ArrowLeftRight className="size-5" />
                  Оформить обмен на {formatUZS(Math.abs(settlementDelta))} UZS
                </>
              ) : (
                <>
                  <RotateCcw className="size-5" />
                  Оформить возврат на {formatUZS(returnTotal)} UZS
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
