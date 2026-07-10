'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScanLine, Plus, FileText } from 'lucide-react'
import {
  DetailHeader,
  PrimaryButton,
  SubTabs,
  DetailToolbar,
  DetailTableCard,
  DetailHeadRow,
  DetailRow,
  QtyInput,
} from './detail-shared'
import { Pagination } from './shared'
import { readProducts, type CatalogProduct } from '@/lib/erp/product-catalog'
import { createPurchaseOrder, readSuppliers } from '@/lib/erp/erp-store'

type ProductDraft = {
  productId: string
  name: string
  sku: string
  barcode: string
  stock: number
  orderedQty: string
  costUsd: string
  markup: string
  sale: string
  low: string
}

const columns = [
  { label: 'Наименование', className: 'flex-[1.3]' },
  { label: 'Артикул', className: 'max-w-[120px]' },
  { label: 'Баркод', className: 'max-w-[150px]' },
  { label: 'Кол-во', className: 'max-w-[80px]' },
  { label: 'К заказу', className: 'max-w-[120px]' },
  { label: 'Цена прихода', className: 'max-w-[120px]' },
  { label: 'Наценка', className: 'max-w-[130px]' },
  { label: 'Цена продажи', className: 'max-w-[130px]' },
  { label: 'Малый ост.', className: 'max-w-[90px]' },
]

export function OrderCreate({
  supplier: initialSupplier,
  store: initialStore,
  name: initialName,
  date: initialDate,
}: {
  supplier?: string
  store?: string
  name?: string
  date?: string
}) {
  const router = useRouter()
  const products = useMemo(() => readProducts(), [])
  const suppliers = useMemo(() => readSuppliers(), [])
  const supplierName = initialSupplier || suppliers[0]?.name || 'Основной поставщик'
  const supplier = suppliers.find((item) => item.name === supplierName) ?? suppliers[0]
  const store = initialStore || 'Магазин / Подвал'
  const orderName = initialName || 'Новый заказ'
  const expectedDate = initialDate || new Date().toISOString().slice(0, 10)

  const [tab, setTab] = useState(0)
  const [state, setState] = useState<Record<string, ProductDraft>>(
    Object.fromEntries(products.map((product) => [product.id, mapProduct(product)])),
  )
  const [error, setError] = useState('')

  const rows = useMemo(() => Object.values(state), [state])

  function upd(id: string, key: keyof ProductDraft, value: string) {
    setState((current) => ({ ...current, [id]: { ...current[id], [key]: value } }))
  }

  function handleSave() {
    if (!supplier) {
      setError('Поставщик не найден.')
      return
    }

    try {
      createPurchaseOrder({
        name: orderName,
        supplierId: supplier.id,
        store,
        expectedDate,
        lines: rows
          .map((row) => ({
            productId: row.productId,
            orderedQty: Number(row.orderedQty.replace(/[^\d]/g, '')) || 0,
            costUsd: Number(row.costUsd.replace(/[^\d.]/g, '')) || 0,
            markupPercent: Number(row.markup.replace(/[^\d.]/g, '')) || 0,
            salePrice: Number(row.sale.replace(/[^\d]/g, '')) || 0,
          }))
          .filter((row) => row.orderedQty > 0),
      })
      router.push('/tovary/zakazy')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать заказ.')
    }
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        title={orderName}
        subtitle={
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-muted-foreground" />
            Черновик • {supplierName} • {store}
          </span>
        }
        backHref="/tovary/zakazy"
        editable
        actions={<PrimaryButton onClick={handleSave}>Создать</PrimaryButton>}
      />

      <SubTabs
        tabs={[
          { label: 'К заказу', count: rows.filter((row) => Number(row.orderedQty) > 0).length },
          { label: 'Все', count: rows.length },
          { label: 'Малый остаток', count: rows.filter((row) => row.stock <= Number(row.low)).length },
          { label: 'Нулевой остаток', count: rows.filter((row) => row.stock <= 0).length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <DetailToolbar
        placeholder="Артикул, баркод, наименование"
        right={
          <div className="flex items-center gap-3">
            <button className="flex h-14 items-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
              <ScanLine className="size-5 text-primary" />
              Включить скан
            </button>
            <button className="flex h-14 items-center gap-2 rounded-2xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90">
              <Plus className="size-5" />
              Новый продукт
            </button>
            <button
              aria-label="Заметка"
              className="flex size-14 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <FileText className="size-5" />
            </button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <DetailTableCard>
        <DetailHeadRow columns={columns} />
        {rows.map((row) => (
          <DetailRow key={row.productId}>
            <div className="flex-[1.3] font-semibold text-primary">{row.name}</div>
            <div className="max-w-[120px] flex-1 text-muted-foreground">{row.sku}</div>
            <div className="max-w-[150px] flex-1 text-muted-foreground">{row.barcode}</div>
            <div className="max-w-[80px] flex-1 text-foreground">{row.stock} шт</div>
            <div className="max-w-[120px] flex-1">
              <QtyInput value={row.orderedQty} suffix="шт" onChange={(value) => upd(row.productId, 'orderedQty', value)} />
            </div>
            <div className="max-w-[120px] flex-1">
              <QtyInput value={row.costUsd} suffix="USD" onChange={(value) => upd(row.productId, 'costUsd', value)} />
            </div>
            <div className="max-w-[130px] flex-1">
              <QtyInput value={row.markup} suffix="%" onChange={(value) => upd(row.productId, 'markup', value)} />
            </div>
            <div className="max-w-[130px] flex-1">
              <QtyInput value={row.sale} suffix="UZS" onChange={(value) => upd(row.productId, 'sale', value)} />
            </div>
            <div className="max-w-[90px] flex-1 text-muted-foreground">{row.low}</div>
          </DetailRow>
        ))}
      </DetailTableCard>

      <Pagination pages={1} />
    </div>
  )
}

function mapProduct(product: CatalogProduct): ProductDraft {
  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    stock: product.stock,
    orderedQty: '',
    costUsd: '0',
    markup: '0',
    sale: String(product.price),
    low: String(product.lowStockThreshold),
  }
}
