'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Settings2,
  Download,
  Plus,
  Move,
  FileText,
  Tag,
  History,
  QrCode,
  AlertCircle,
  Package,
  Warehouse,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUZS, type CatalogProduct } from '@/lib/erp/product-catalog'
import {
  readInventoryMovements,
  getProductWarehouseStocks,
  ERP_DATA_CHANGED,
  type ErpInventoryMovement,
  type ProductWarehouseStock,
} from '@/lib/erp/erp-store'
import {
  DetailHeader,
  DetailTableCard,
  DetailHeadRow,
  DetailRow,
  StatCard,
} from './detail-shared'

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type ProductInfo = Pick<
  CatalogProduct,
  | 'id'
  | 'name'
  | 'sku'
  | 'barcode'
  | 'category'
  | 'brand'
  | 'supplier'
  | 'unit'
  | 'price'
  | 'wholesalePrice'
  | 'stock'
  | 'lowStockThreshold'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
>

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function ProductDetail({ product }: { product: ProductInfo }) {
  const [warehouseStocks, setWarehouseStocks] = useState<ProductWarehouseStock[]>([])
  const [movements, setMovements] = useState<ErpInventoryMovement[]>([])
  const [totalMovements, setTotalMovements] = useState(0)

  // Load data from localStorage (only available in browser)
  useEffect(() => {
    function load() {
      const stocks = getProductWarehouseStocks(product.id)
      setWarehouseStocks(stocks)

      const allMovements = readInventoryMovements().filter(
        (m) => m.productId === product.id,
      )
      setTotalMovements(allMovements.length)
      setMovements(allMovements.slice(0, 20))
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [product.id])

  const isActive = product.status === 'active'
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold
  const isOutOfStock = product.stock <= 0

  // Derived values
  const totalWarehouseStock = warehouseStocks.reduce((sum, w) => sum + w.qty, 0)
  const stockValue = product.price * product.stock

  return (
    <>
      {/* ── Header ── */}
      <DetailHeader
        title={product.name}
        subtitle={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="rounded-full bg-secondary px-3 py-1 text-[13px] font-mono font-medium text-muted-foreground">
              {product.sku}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-[13px] font-mono font-medium text-muted-foreground">
              {product.barcode}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[13px] text-muted-foreground">{product.category}</span>
            {product.brand && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-[13px] text-muted-foreground">{product.brand}</span>
              </>
            )}
            <span
              className={cn(
                'rounded-full px-3 py-1 text-[12px] font-bold',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {isActive ? 'Активен' : 'Неактивен'}
            </span>
            {isOutOfStock && (
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-[12px] font-bold text-destructive">
                Нет в наличии
              </span>
            )}
            {isLowStock && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[12px] font-bold text-amber-600">
                Мало остатков
              </span>
            )}
          </div>
        }
        backHref="/tovary"
        actions={
          <Link
            href={`/tovary/${product.id}/edit`}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Settings2 className="size-4" />
            Редактировать
          </Link>
        }
      />

      <div className="mt-8 space-y-6">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Цена розницы"
            value={formatUZS(product.price)}
            unit="UZS"
            icon={<Tag className="size-6" />}
          />
          <StatCard
            label="Цена опта"
            value={formatUZS(product.wholesalePrice)}
            unit="UZS"
            icon={<Tag className="size-6" />}
            accent
          />
          <StatCard
            label="Общий остаток"
            value={totalWarehouseStock.toString()}
            unit={product.unit}
            icon={<Package className="size-6" />}
          />
          <StatCard
            label="Стоимость остатка"
            value={formatUZS(stockValue)}
            unit="UZS"
            icon={<AlertCircle className="size-6" />}
          />
        </div>

        {/* ── Stocks by warehouse ── */}
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Warehouse className="size-5 text-primary" />
              <h3 className="text-[15px] font-bold text-foreground">Остатки по складам</h3>
            </div>
            <span className="text-[13px] font-medium text-muted-foreground">
              Всего: {totalWarehouseStock} {product.unit}
            </span>
          </div>
          <div className="divide-y divide-border">
            {warehouseStocks.length === 0 ? (
              /* skeleton while loading */
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="size-10 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                  <div className="h-5 w-16 rounded bg-muted" />
                </div>
              ))
            ) : (
              warehouseStocks.map((item) => {
                const isZero = item.qty === 0
                const isLow = item.qty > 0 && item.qty <= product.lowStockThreshold

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold',
                          isZero
                            ? 'bg-destructive/10 text-destructive'
                            : isLow
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-primary/10 text-primary',
                        )}
                      >
                        {isZero ? '0' : item.qty}
                      </div>
                      {/* Info */}
                      <div>
                        <p className="text-[15px] font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          {isZero
                            ? 'Нет в наличии'
                            : `${item.qty} ${product.unit} · ${formatUZS(item.qty * product.price)} UZS`}
                        </p>
                      </div>
                    </div>
                    {/* Badge */}
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-[15px] font-bold',
                          isZero
                            ? 'text-destructive'
                            : isLow
                              ? 'text-amber-600'
                              : 'text-foreground',
                        )}
                      >
                        {item.qty} {product.unit}
                      </span>
                      {isLow && (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600">
                          мало
                        </span>
                      )}
                      {isZero && (
                        <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive">
                          нет
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href={`/tovary/transfer?product=${product.id}`}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Move className="size-5 text-primary" />
            Переместить
          </Link>
          <Link
            href={`/tovary/spisanie?product=${product.id}`}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <FileText className="size-5 text-primary" />
            Списание
          </Link>
          <Link
            href={`/tovary/pereocenka?product=${product.id}`}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Tag className="size-5 text-primary" />
            Переоценка
          </Link>
          <Link
            href={`/tovary/zakazy/create?product=${product.id}`}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Plus className="size-5 text-primary" />
            Заказать
          </Link>
        </div>

        {/* ── Product info card ── */}
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-[15px] font-bold text-foreground">Информация о товаре</h3>
          </div>
          <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {/* Left column */}
            <div className="divide-y divide-border">
              <InfoRow label="Наименование" value={product.name} />
              <InfoRow label="Артикул (SKU)" value={product.sku} mono />
              <InfoRow label="Баркод" value={product.barcode} mono />
              <InfoRow label="Категория" value={product.category} />
              <InfoRow label="Бренд" value={product.brand || '—'} />
            </div>
            {/* Right column */}
            <div className="divide-y divide-border">
              <InfoRow label="Поставщик" value={product.supplier || '—'} />
              <InfoRow label="Единица" value={product.unit} />
              <InfoRow label="Мин. порог" value={`${product.lowStockThreshold} ${product.unit}`} />
              <InfoRow
                label="Добавлен"
                value={new Date(product.createdAt).toLocaleDateString('ru-RU')}
              />
              <InfoRow
                label="Обновлён"
                value={new Date(product.updatedAt).toLocaleDateString('ru-RU')}
              />
            </div>
          </div>
        </div>

        {/* ── QR / barcode ── */}
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border p-6">
          <h3 className="text-[15px] font-bold text-foreground mb-4">Идентификация</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-36 shrink-0 items-center justify-center rounded-2xl bg-secondary">
              <QrCode className="size-24 text-muted-foreground/40" />
            </div>
            <div className="space-y-3">
              <p className="text-[14px] text-muted-foreground">
                Сканируйте баркод на кассе или при проведении инвентаризации.
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-muted-foreground w-20">ID</span>
                  <code className="rounded bg-secondary px-2 py-0.5 text-[13px] font-mono text-foreground">
                    {product.id}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-muted-foreground w-20">SKU</span>
                  <code className="rounded bg-secondary px-2 py-0.5 text-[13px] font-mono text-foreground">
                    {product.sku}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-muted-foreground w-20">Баркод</span>
                  <code className="rounded bg-secondary px-2 py-0.5 text-[13px] font-mono text-foreground">
                    {product.barcode}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Movement history ── */}
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <History className="size-5 text-primary" />
              <h3 className="text-[15px] font-bold text-foreground">История движений</h3>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-[13px] font-medium text-muted-foreground">
              {totalMovements} записей
            </span>
          </div>

          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="size-12 text-muted-foreground/20" />
              <p className="mt-3 text-[15px] font-medium text-muted-foreground">
                Движений по этому товару пока нет
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Здесь появятся продажи, поступления и перемещения
              </p>
            </div>
          ) : (
            <>
              <DetailTableCard>
                <DetailHeadRow
                  withSettings={false}
                  template="140px 1fr 160px 80px 100px 80px 1fr"
                  columns={[
                    { label: 'Дата и время' },
                    { label: 'Склад' },
                    { label: 'Тип' },
                    { label: 'До' },
                    { label: 'Изменение' },
                    { label: 'После' },
                    { label: 'Причина' },
                  ]}
                />
                {movements.map((movement) => (
                  <DetailRow
                    key={movement.id}
                    withSettings={false}
                    template="140px 1fr 160px 80px 100px 80px 1fr"
                  >
                    <div className="text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatMovementDate(movement.createdAt)}
                    </div>
                    <div className="truncate text-[15px] font-medium text-foreground">
                      {movement.warehouseName}
                    </div>
                    <div>
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-[12px] font-bold',
                          movementTypeColor(movement.type),
                        )}
                      >
                        {movementTypeLabel(movement.type)}
                      </span>
                    </div>
                    <div className="text-[15px] text-foreground">{movement.beforeQty}</div>
                    <div
                      className={cn(
                        'text-[15px] font-bold',
                        movement.qty > 0 ? 'text-primary' : 'text-destructive',
                      )}
                    >
                      {movement.qty > 0 ? '+' : ''}
                      {movement.qty}
                    </div>
                    <div className="text-[15px] font-semibold text-foreground">
                      {movement.afterQty}
                    </div>
                    <div className="truncate text-[13px] text-muted-foreground">
                      {movement.reason || '—'}
                    </div>
                  </DetailRow>
                ))}
              </DetailTableCard>
              {totalMovements > 20 && (
                <div className="border-t border-border px-6 py-4 text-center">
                  <p className="text-[13px] text-muted-foreground">
                    Показано 20 из {totalMovements} записей
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      <span className="text-[13px] font-medium text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          'text-[14px] text-foreground text-right truncate',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function movementTypeLabel(type: ErpInventoryMovement['type']): string {
  const map: Record<ErpInventoryMovement['type'], string> = {
    sale: 'Продажа',
    sale_return: 'Возврат',
    writeoff: 'Списание',
    transfer_in: 'Приход',
    transfer_out: 'Расход',
    supplier_return: 'Возврат пост.',
    inventory_adjustment: 'Инвентарь',
    manual: 'Вручную',
  }
  return map[type] ?? type
}

function movementTypeColor(type: ErpInventoryMovement['type']): string {
  if (type === 'sale' || type === 'writeoff' || type === 'transfer_out' || type === 'supplier_return') {
    return 'bg-destructive/10 text-destructive'
  }
  if (type === 'sale_return' || type === 'transfer_in' || type === 'manual') {
    return 'bg-primary/10 text-primary'
  }
  if (type === 'inventory_adjustment') {
    return 'bg-amber-500/10 text-amber-600'
  }
  return 'bg-secondary text-muted-foreground'
}

function formatMovementDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/* ─────────────────────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────────────────────── */

export function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-28 rounded-3xl bg-muted" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-muted" />
    </div>
  )
}
