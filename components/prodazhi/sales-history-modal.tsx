'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X, ArrowRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  formatDateTime,
  readSales,
  type ErpSale,
} from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'
import { SaleDetailModal, type SaleDetail } from './sale-detail-modal'

function mapToDetail(sale: ErpSale): SaleDetail {
  const units = sale.lines.reduce((sum, l) => sum + l.qty, 0)
  const isReturn = sale.type === 'return'
  const type =
    isReturn
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
  }
}

export function SalesHistoryModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [sales, setSales] = useState<ErpSale[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SaleDetail | null>(null)

  useEffect(() => {
    if (!open) return

    function load() {
      setSales(readSales())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelected(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sales.slice(0, 50)
    return sales
      .filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          (s.client ?? '').toLowerCase().includes(q) ||
          s.seller.toLowerCase().includes(q) ||
          s.lines.some((l) => l.name.toLowerCase().includes(q)),
      )
      .slice(0, 50)
  }, [sales, query])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 py-10 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-3xl bg-card shadow-2xl ring-1 ring-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
            <h2 className="text-2xl font-black text-foreground">История продаж</h2>
            <button
              aria-label="Закрыть"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ID, клиент, продавец, товар"
                className="h-12 w-full rounded-2xl bg-secondary pl-12 pr-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[480px] overflow-y-auto px-6 pb-6 no-scrollbar">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RotateCcw className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-[15px] font-semibold text-muted-foreground">
                  {query ? 'Ничего не найдено' : 'Продаж пока нет'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((sale) => {
                  const units = sale.lines.reduce((sum, l) => sum + l.qty, 0)
                  const isReturn = sale.type === 'return'
                  const label =
                    isReturn
                      ? 'Возврат'
                      : sale.saleChannel === 'wholesale'
                        ? 'Опт'
                        : sale.type === 'exchange'
                          ? 'Обмен'
                          : 'Продажа'

                  return (
                    <button
                      key={sale.id}
                      onClick={() => setSelected(mapToDetail(sale))}
                      className="flex w-full items-center gap-4 rounded-2xl bg-secondary/60 px-4 py-3 text-left transition-colors hover:bg-secondary"
                    >
                      <span className="flex min-w-[64px] shrink-0 items-center justify-center rounded-xl bg-card px-2 py-1.5 text-center text-[13px] font-bold text-muted-foreground shadow-sm ring-1 ring-border">
                        {isReturn ? `−${units}` : `${units}`} шт
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-foreground">
                          {label} #{sale.id}
                        </p>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {formatDateTime(sale.createdAt)}
                          {sale.client ? ` · ${sale.client}` : ''}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-[15px] font-black',
                          sale.total < 0 ? 'text-destructive' : 'text-primary',
                        )}
                      >
                        {formatUZS(sale.total)} UZS
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <SaleDetailModal sale={selected} onClose={() => setSelected(null)} />
    </>
  )
}
