'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Boxes,
  AlertTriangle,
  PackagePlus,
  ArrowRight,
} from 'lucide-react'
import { StatCard, SubTabs, PrimaryButton, QtyInput } from './detail-shared'
import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import {
  DEFAULT_WAREHOUSE_ID,
  completeInventoryDocument,
  getInventoryDocument,
  updateInventoryCounts,
  getWarehouseStock,
} from '@/lib/erp/erp-store'

type ResultRow = {
  product: CatalogProduct
  current: number
  counted: number
  diff: number
}

export function InventoryResult({ id }: { id: string }) {
  const [tab, setTab] = useState(0)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function load() {
      const document = getInventoryDocument(id)
      const nextProducts = readProducts().filter((product) => product.status === 'active')
      setProducts(nextProducts)
      setCounts((current) => {
        const next = { ...current }
        for (const product of nextProducts) {
          if (document?.counts[product.id] !== undefined) {
            next[product.id] = String(document.counts[product.id])
          }
        }
        return next
      })
    }

    load()
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [id])

  const rows = useMemo<ResultRow[]>(
    () =>
      products.map((product) => {
        const current = getWarehouseStock(product.id, DEFAULT_WAREHOUSE_ID)
        const counted = Math.max(0, Math.floor(Number(counts[product.id]) || 0))

        return {
          product,
          current,
          counted,
          diff: counted - current,
        }
      }),
    [counts, products],
  )

  const missingQty = rows.reduce(
    (sum, row) => sum + (row.diff < 0 ? Math.abs(row.diff) : 0),
    0,
  )
  const surplusQty = rows.reduce(
    (sum, row) => sum + (row.diff > 0 ? row.diff : 0),
    0,
  )
  const missingAmount = rows.reduce(
    (sum, row) =>
      sum + (row.diff < 0 ? Math.abs(row.diff) * row.product.price : 0),
    0,
  )
  const surplusAmount = rows.reduce(
    (sum, row) => sum + (row.diff > 0 ? row.diff * row.product.price : 0),
    0,
  )

  function completeInventory() {
    setError('')
    setStatus('')

    const changedRows = rows.filter((row) => row.diff !== 0)
    if (changedRows.length === 0) {
      setStatus('Расхождений нет. Остатки уже совпадают.')
      return
    }

    try {
      const movementCount = completeInventoryDocument(id).length
      setStatus(`Инвентаризация завершена. Создано движений: ${movementCount}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось завершить инвентаризацию.')
    }
  }

  const filteredRows = rows.filter((row) => {
    if (tab === 0) return false
    if (tab === 2) return row.diff < 0
    if (tab === 4) return row.diff > 0
    return true
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/tovary/inventarizaciya/${id}`}
            className="flex items-center gap-2 rounded-2xl bg-card px-5 py-3 text-[15px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
            Сканирование
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Результаты инвентаризации
          </h1>
        </div>
        <PrimaryButton onClick={completeInventory}>Завершить</PrimaryButton>
      </div>

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="rounded-2xl bg-primary/10 px-5 py-4 text-[15px] font-semibold text-primary ring-1 ring-primary/20">
          {status}
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-xl font-black text-foreground">Статистика</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Всего товаров проверено"
            value={String(rows.length)}
            unit="ед."
            icon={<Boxes className="size-6" />}
          />
          <StatCard
            label="Кол-во недостач"
            value={String(missingQty)}
            unit="ед."
            icon={<AlertTriangle className="size-6" />}
          />
          <StatCard
            label="Кол-во излишков"
            value={String(surplusQty)}
            unit="ед."
            icon={<PackagePlus className="size-6" />}
          />
          <button className="flex items-center justify-between gap-4 rounded-3xl bg-primary p-6 text-left text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90">
            <div>
              <p className="text-[15px] font-semibold">Генерировать</p>
              <p className="text-[15px] font-semibold">Отчет</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <ArrowRight className="size-6" />
            </span>
          </button>

          <StatCard
            label="Недостачи по цене продажи"
            value={formatUZS(missingAmount)}
            unit="UZS"
            icon={<AlertTriangle className="size-6" />}
          />
          <StatCard
            label="Излишки по цене продажи"
            value={formatUZS(surplusAmount)}
            unit="UZS"
            icon={<PackagePlus className="size-6" />}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-foreground">Действие</h2>
        <SubTabs
          tabs={[
            { label: 'Новые товары', count: 0 },
            { label: 'Пересорты', count: 0 },
            { label: 'Недостачи', count: missingQty },
            { label: 'Неактивные товары', count: 0 },
            { label: 'Излишки', count: surplusQty },
          ]}
          active={tab}
          onChange={setTab}
        />

        <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <div className="grid grid-cols-[180px_1fr_140px_130px_130px_140px] items-center gap-4 border-b border-border px-6 py-4 text-[14px] font-semibold text-muted-foreground">
            <div>Баркод</div>
            <div>Наименование</div>
            <div>Артикул</div>
            <div>Учет</div>
            <div>Факт</div>
            <div>Разница</div>
          </div>
          {filteredRows.length > 0 ? (
            filteredRows.map((row) => (
              <div
                key={row.product.id}
                className="grid grid-cols-[180px_1fr_140px_130px_130px_140px] items-center gap-4 border-b border-border px-6 py-4 text-[15px] last:border-b-0"
              >
                <div className="truncate text-muted-foreground">{row.product.barcode}</div>
                <div className="truncate font-semibold text-primary">{row.product.name}</div>
                <div className="truncate text-muted-foreground">{row.product.sku}</div>
                <div className="font-semibold text-foreground">
                  {row.current} {row.product.unit}
                </div>
                <QtyInput
                  value={counts[row.product.id] ?? '0'}
                  suffix={row.product.unit}
                  onChange={(value) => {
                    const next = { ...counts, [row.product.id]: value.replace(/[^\d]/g, '') }
                    try {
                      updateInventoryCounts(id, Object.fromEntries(Object.entries(next).map(([productId, qty]) => [productId, Number(qty) || 0])))
                      setCounts(next)
                      setError('')
                    } catch (nextError) {
                      setError(nextError instanceof Error ? nextError.message : 'Не удалось сохранить фактическое количество.')
                    }
                  }}
                />
                <div
                  className={
                    row.diff < 0
                      ? 'font-bold text-destructive'
                      : row.diff > 0
                        ? 'font-bold text-primary'
                        : 'font-semibold text-muted-foreground'
                  }
                >
                  {row.diff > 0 ? '+' : ''}
                  {row.diff} {row.product.unit}
                </div>
              </div>
            ))
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
              <h2 className="text-xl font-bold text-foreground">
                Расхождений пока нет
              </h2>
              <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
                Измените фактическое количество в таблице, чтобы сформировать корректировки.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
