'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ScanLine } from 'lucide-react'
import {
  DetailHeader,
  PrimaryButton,
  GhostButton,
  SubTabs,
  DetailToolbar,
  DetailTableCard,
  DetailHeadRow,
  DetailRow,
  QtyInput,
} from './detail-shared'
import { Pagination } from './shared'
import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import {
  applyInventoryChanges,
  getWarehouseStock,
} from '@/lib/erp/erp-store'

type RowProduct = {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  current: number
  supplier: number
  sale: number
  unit: string
}

const columns = [
  { label: 'Наименование', className: 'flex-[1.4]' },
  { label: 'Артикул', className: 'max-w-[110px]' },
  { label: 'Баркод', className: 'max-w-[160px]' },
  { label: 'Категория', className: 'max-w-[110px]' },
  { label: 'Текущее кол-во', className: 'max-w-[130px]' },
  { label: 'Цена поставки', className: 'max-w-[130px]' },
  { label: 'Цена продажи', className: 'max-w-[130px]' },
  { label: 'Списание', className: 'max-w-[130px]' },
]

function toRow(product: CatalogProduct): RowProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    category: product.category,
    current: getWarehouseStock(product.id),
    supplier: product.wholesalePrice,
    sale: product.price,
    unit: product.unit,
  }
}

export function WriteOffDetail({ id }: { id: string }) {
  const [tab, setTab] = useState(0)
  const [qty, setQty] = useState<Record<string, string>>({})
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function load() {
      setProducts(readProducts().filter((product) => product.status === 'active'))
    }

    load()
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const rows = useMemo(
    () => products.slice(0, 10).map(toRow),
    [products],
  )

  const writeOffQty = rows.reduce(
    (sum, product) => sum + (Number(qty[product.id]) || 0),
    0,
  )

  function handleWriteOff() {
    setError('')
    setStatus('')

    const changes = rows
      .map((product) => ({
        product,
        amount: Math.floor(Number(qty[product.id]) || 0),
      }))
      .filter((item) => item.amount > 0)

    if (changes.length === 0) {
      setError('Укажите количество для списания.')
      return
    }

    try {
      applyInventoryChanges(
        changes.map((item) => ({
          productId: item.product.id,
          delta: -item.amount,
          type: 'writeoff',
          sourceId: id,
          reason: 'Списание товара',
        })),
      )
      setQty({})
      setStatus(`Списано ${changes.reduce((sum, item) => sum + item.amount, 0)} ед.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось провести списание.')
    }
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        title="Брак футболки"
        subtitle="Списание • Магазин"
        backHref="/tovary/spisanie"
        editable
        actions={
          <>
            <GhostButton tone="danger">Отклонить</GhostButton>
            <PrimaryButton onClick={handleWriteOff}>Списать</PrimaryButton>
          </>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SubTabs
          tabs={[
            { label: 'Все', count: rows.length },
            { label: 'К списанию', count: writeOffQty },
          ]}
          active={tab}
          onChange={setTab}
        />
        <button className="flex shrink-0 items-center gap-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronDown className="size-4" />
          Показать статистику
        </button>
      </div>

      <DetailToolbar
        right={
          <button className="flex h-14 items-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
            <ScanLine className="size-5 text-primary" />
            Включить скан
          </button>
        }
      />

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

      <DetailTableCard>
        <DetailHeadRow columns={columns} />
        {rows.map((product) => (
          <DetailRow key={product.id}>
            <div className="flex-[1.4] font-semibold text-primary">{product.name}</div>
            <div className="max-w-[110px] flex-1 text-muted-foreground">
              {product.sku}
            </div>
            <div className="max-w-[160px] flex-1 text-muted-foreground">
              {product.barcode}
            </div>
            <div className="max-w-[110px] flex-1 text-muted-foreground">
              {product.category}
            </div>
            <div className="max-w-[130px] flex-1 font-semibold text-foreground">
              {product.current} {product.unit}
            </div>
            <div className="max-w-[130px] flex-1 text-foreground">
              {product.supplier ? `${formatUZS(product.supplier)} UZS` : '-'}
            </div>
            <div className="max-w-[130px] flex-1 text-foreground">
              {formatUZS(product.sale)} UZS
            </div>
            <div className="max-w-[130px] flex-1">
              <QtyInput
                value={qty[product.id] ?? '0'}
                suffix={product.unit}
                onChange={(value) =>
                  setQty((current) => ({
                    ...current,
                    [product.id]: value.replace(/[^\d]/g, ''),
                  }))
                }
              />
            </div>
          </DetailRow>
        ))}
      </DetailTableCard>

      <Pagination pages={1} />
    </div>
  )
}
