'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ScanLine, FileText, ArrowRight } from 'lucide-react'
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
import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import {
  DEFAULT_WAREHOUSE_ID,
  ERP_DATA_CHANGED,
  getWarehouseStock,
  readInventoryMovements,
  readWarehouses,
  transferInventory,
  type ErpInventoryMovement,
} from '@/lib/erp/erp-store'

type RowProduct = {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  supplier: number
  sale: number
  from: number
  to: number
  unit: string
}

type CompletedTransferRow = {
  productId: string
  productName: string
  sku: string
  barcode: string
  from: string
  to: string
  qty: number
  beforeFrom: number
  afterFrom: number
  beforeTo: number
  afterTo: number
}

const columns = [
  { label: 'Наименование', className: 'flex-[1.4]' },
  { label: 'Артикул', className: 'max-w-[110px]' },
  { label: 'Баркод', className: 'max-w-[160px]' },
  { label: 'Категория', className: 'max-w-[100px]' },
  { label: 'Цена поставки', className: 'max-w-[140px]' },
  { label: 'Цена продажи', className: 'max-w-[130px]' },
  { label: 'Из склада', className: 'max-w-[110px]' },
  { label: 'В магазин/подвал', className: 'max-w-[120px]' },
  { label: 'К отправке', className: 'max-w-[120px]' },
]

const completedColumns = [
  { label: 'Наименование', className: 'flex-[1.4]' },
  { label: 'Артикул', className: 'max-w-[110px]' },
  { label: 'Баркод', className: 'max-w-[160px]' },
  { label: 'Из склада', className: 'max-w-[120px]' },
  { label: 'В локацию', className: 'max-w-[140px]' },
  { label: 'Кол-во', className: 'max-w-[90px]' },
  { label: 'Было', className: 'max-w-[90px]' },
  { label: 'Стало', className: 'max-w-[90px]' },
]

function toRow(product: CatalogProduct, fromWarehouseId: string): RowProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    category: product.category,
    supplier: product.wholesalePrice,
    sale: product.price,
    from: getWarehouseStock(product.id, fromWarehouseId),
    to: getWarehouseStock(product.id, DEFAULT_WAREHOUSE_ID),
    unit: product.unit,
  }
}

export function TransferDetail({
  id,
  initialProductId,
  initialQty,
  initialSourceWarehouseId,
  returnHref,
}: {
  id: string
  initialProductId?: string
  initialQty?: string
  initialSourceWarehouseId?: string
  returnHref?: string
}) {
  const [tab, setTab] = useState(0)
  const [qty, setQty] = useState<Record<string, string>>({})
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [movements, setMovements] = useState<ErpInventoryMovement[]>([])
  const [sourceWarehouseId, setSourceWarehouseId] = useState('warehouse-1')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function load() {
      setProducts(readProducts().filter((product) => product.status === 'active'))
      setMovements(
        readInventoryMovements().filter(
          (movement) =>
            movement.sourceId === id &&
            (movement.type === 'transfer_out' || movement.type === 'transfer_in'),
        ),
      )
    }

    load()
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [id])

  const warehouses = useMemo(() => readWarehouses(), [])
  const sourceWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.id !== DEFAULT_WAREHOUSE_ID),
    [warehouses],
  )

  useEffect(() => {
    if (
      initialSourceWarehouseId &&
      sourceWarehouses.some((warehouse) => warehouse.id === initialSourceWarehouseId)
    ) {
      setSourceWarehouseId(initialSourceWarehouseId)
    }
  }, [initialSourceWarehouseId, sourceWarehouses])

  useEffect(() => {
    if (!initialProductId || !initialQty) return
    const product = products.find((item) => item.id === initialProductId)
    if (!product) return

    const available = getWarehouseStock(product.id, sourceWarehouseId)
    const amount = Math.min(Math.max(1, Math.floor(Number(initialQty) || 1)), available)
    if (amount <= 0) return

    setQty((current) => {
      if (current[product.id] !== undefined) return current
      return { ...current, [product.id]: String(amount) }
    })
    setTab(1)
  }, [initialProductId, initialQty, products, sourceWarehouseId])

  const rows = useMemo(
    () => {
      const value = query.trim().toLowerCase()
      const orderedProducts = initialProductId
        ? [
            ...products.filter((product) => product.id === initialProductId),
            ...products.filter((product) => product.id !== initialProductId),
          ]
        : products

      return orderedProducts
        .filter((product) => {
          if (!value) return true
          return [
            product.name,
            product.sku,
            product.barcode,
            product.category,
          ].some((item) => item.toLowerCase().includes(value))
        })
        .slice(0, 10)
        .map((product) => toRow(product, sourceWarehouseId))
    },
    [initialProductId, products, query, sourceWarehouseId],
  )

  const completedRows = useMemo<CompletedTransferRow[]>(() => {
    const value = query.trim().toLowerCase()
    const grouped = new Map<
      string,
      { out?: ErpInventoryMovement; ins?: ErpInventoryMovement }
    >()

    for (const movement of movements) {
      const current = grouped.get(movement.productId) ?? {}
      if (movement.type === 'transfer_out') current.out = movement
      if (movement.type === 'transfer_in') current.ins = movement
      grouped.set(movement.productId, current)
    }

    return Array.from(grouped.values())
      .map((group) => {
        const anchor = group.out ?? group.ins
        const product = products.find((item) => item.id === anchor?.productId)

        return {
          productId: anchor?.productId ?? '',
          productName: anchor?.productName ?? '-',
          sku: product?.sku ?? '-',
          barcode: product?.barcode ?? '-',
          from: group.out?.warehouseName ?? '-',
          to: group.ins?.warehouseName ?? '-',
          qty: Math.abs(group.out?.qty ?? group.ins?.qty ?? 0),
          beforeFrom: group.out?.beforeQty ?? 0,
          afterFrom: group.out?.afterQty ?? 0,
          beforeTo: group.ins?.beforeQty ?? 0,
          afterTo: group.ins?.afterQty ?? 0,
        }
      })
      .filter((row) => {
        if (!value) return true
        return [
          row.productName,
          row.sku,
          row.barcode,
          row.from,
          row.to,
        ].some((item) => item.toLowerCase().includes(value))
      })
  }, [movements, products, query])

  const completed = movements.length > 0

  const fromWarehouse =
    warehouses.find((warehouse) => warehouse.id === sourceWarehouseId)?.name ??
    'Склад №1'
  const toWarehouse =
    warehouses.find((warehouse) => warehouse.id === DEFAULT_WAREHOUSE_ID)?.name ??
    'Магазин / Подвал'
  const safeReturnHref = returnHref?.startsWith('/') ? returnHref : null

  const transferQty = rows.reduce(
    (sum, product) => sum + (Number(qty[product.id]) || 0),
    0,
  )

  function handleTransfer() {
    setError('')
    setStatus('')

    const changes = rows
      .map((product) => ({
        product,
        amount: Math.floor(Number(qty[product.id]) || 0),
      }))
      .filter((item) => item.amount > 0)

    if (changes.length === 0) {
      setError('Укажите количество для перемещения.')
      return
    }

    const overstocked = changes.find((item) => item.amount > item.product.from)
    if (overstocked) {
      setError(
        `На складе "${fromWarehouse}" доступно только ${overstocked.product.from} ${overstocked.product.unit} товара "${overstocked.product.name}".`,
      )
      return
    }

    try {
      for (const item of changes) {
        transferInventory({
          productId: item.product.id,
          qty: item.amount,
          fromWarehouseId: sourceWarehouseId,
          toWarehouseId: DEFAULT_WAREHOUSE_ID,
          sourceId: id,
        })
      }
      setQty({})
      setStatus(`Перемещено ${changes.reduce((sum, item) => sum + item.amount, 0)} ед.`)
      setMovements(
        readInventoryMovements().filter(
          (movement) =>
            movement.sourceId === id &&
            (movement.type === 'transfer_out' || movement.type === 'transfer_in'),
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось провести перемещение.')
    }
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        title="Перемещение товара в магазин"
        subtitle={
          <span className="flex flex-wrap items-center gap-1.5">
            Из склада{' '}
            <span className="font-bold text-primary">{fromWarehouse}</span>
            <ArrowRight className="size-4 text-primary" />В магазин{' '}
            <span className="font-bold text-primary">{toWarehouse}</span>
          </span>
        }
        backHref="/tovary/transfer"
        editable={!completed}
        actions={
          completed ? null : (
            <PrimaryButton onClick={handleTransfer}>Переместить</PrimaryButton>
          )
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SubTabs
          tabs={[
            { label: 'Все', count: completed ? completedRows.length : rows.length },
            { label: completed ? 'Перемещено' : 'К перемещению', count: completed ? completedRows.length : transferQty },
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
        placeholder="Поиск по товару, артикулу или баркоду"
        value={query}
        onChange={setQuery}
        right={
          <div className="flex items-center gap-3">
            {!completed ? (
              <div className="relative">
              <select
                value={sourceWarehouseId}
                onChange={(event) => {
                  setSourceWarehouseId(event.target.value)
                  setQty({})
                  setStatus('')
                  setError('')
                }}
                className="h-14 min-w-[180px] rounded-2xl bg-card px-5 pr-10 text-[15px] font-semibold text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
              >
                {sourceWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            ) : null}
            {!completed ? (
              <button className="flex h-14 items-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
                <ScanLine className="size-5 text-primary" />
                Включить скан
              </button>
            ) : null}
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
        <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/10 px-5 py-4 text-[15px] font-semibold text-primary ring-1 ring-primary/20">
          <span>{status}</span>
          {safeReturnHref ? (
            <Link
              href={safeReturnHref}
              className="rounded-xl bg-card px-4 py-2 text-[14px] font-bold text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              Вернуться к продаже
            </Link>
          ) : null}
        </div>
      ) : null}

      <DetailTableCard>
        {completed ? (
          <>
            <DetailHeadRow columns={completedColumns} />
            {completedRows.length > 0 ? (
              completedRows.map((row) => (
                <DetailRow key={row.productId}>
                  <div className="flex-[1.4] font-semibold text-primary">
                    {row.productName}
                  </div>
                  <div className="max-w-[110px] flex-1 text-muted-foreground">
                    {row.sku}
                  </div>
                  <div className="max-w-[160px] flex-1 text-muted-foreground">
                    {row.barcode}
                  </div>
                  <div className="max-w-[120px] flex-1 text-foreground">
                    {row.from}
                  </div>
                  <div className="max-w-[140px] flex-1 text-foreground">
                    {row.to}
                  </div>
                  <div className="max-w-[90px] flex-1 font-semibold text-foreground">
                    {row.qty}
                  </div>
                  <div className="max-w-[90px] flex-1 text-muted-foreground">
                    {row.beforeFrom} / {row.beforeTo}
                  </div>
                  <div className="max-w-[90px] flex-1 text-muted-foreground">
                    {row.afterFrom} / {row.afterTo}
                  </div>
                </DetailRow>
              ))
            ) : (
              <div className="px-6 py-10 text-center text-[15px] font-medium text-muted-foreground">
                Товары по текущему поиску не найдены.
              </div>
            )}
          </>
        ) : (
          <>
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
                <div className="max-w-[100px] flex-1 text-muted-foreground">
                  {product.category}
                </div>
                <div className="max-w-[140px] flex-1 text-foreground">
                  {product.supplier ? `${formatUZS(product.supplier)} UZS` : '-'}
                </div>
                <div className="max-w-[130px] flex-1 text-foreground">
                  {formatUZS(product.sale)} UZS
                </div>
                <div className="max-w-[110px] flex-1 font-semibold text-foreground">
                  {product.from} {product.unit}
                </div>
                <div className="max-w-[100px] flex-1 text-muted-foreground">
                  {product.to} {product.unit}
                </div>
                <div className="max-w-[120px] flex-1">
                  <QtyInput
                    value={qty[product.id] ?? '0'}
                    suffix={product.unit}
                    onChange={(value) =>
                      setQty((current) => ({
                        ...current,
                        [product.id]: String(
                          Math.min(
                            Number(value.replace(/[^\d]/g, '')) || 0,
                            product.from,
                          ),
                        ),
                      }))
                    }
                  />
                </div>
              </DetailRow>
            ))}
          </>
        )}
      </DetailTableCard>

      <Pagination pages={1} />
    </div>
  )
}
