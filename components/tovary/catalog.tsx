'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  ChevronDown,
  ImageIcon,
  Package,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Store,
  WalletCards,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import {
  getActiveBrandOptions,
  getActiveCategoryOptions,
  PRODUCT_REFERENCES_CHANGED,
} from '@/lib/erp/categories'
import { queryItems } from '@/lib/erp/storage'
import {
  DEFAULT_WAREHOUSE_ID,
  getProductWarehouseStocks,
} from '@/lib/erp/erp-store'
import { FilterPanel, useFilters } from '@/components/ui/filter-panel'
import { BulkActionsModal } from './bulk-actions-modal'

type TabId = 'all' | 'active' | 'inactive' | 'low' | 'out'
type CatalogRow = CatalogProduct & { storeStock: number; zoneStock: string }

const tabLabels: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'inactive', label: 'Неактивные' },
  { id: 'low', label: 'Малый остаток' },
  { id: 'out', label: 'Нулевой остаток' },
]

export function Catalog() {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [fieldsOpen, setFieldsOpen] = useState(false)
  const filters = useFilters({ category: '', brand: '', supplier: '', status: '' })

  useEffect(() => {
    function load() {
      setProducts(readProducts())
    }
    load()
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener(PRODUCT_REFERENCES_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener(PRODUCT_REFERENCES_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  useEffect(() => setSelectedIds(new Set()), [activeTab, query, filters.values])

  const rows = useMemo<CatalogRow[]>(
    () => products.map((product) => {
      const warehouseStocks = getProductWarehouseStocks(product.id)
      const storeStock = warehouseStocks.find((warehouse) => warehouse.id === DEFAULT_WAREHOUSE_ID)?.qty ?? 0
      return {
        ...product,
        storeStock,
        zoneStock: warehouseStocks.map((warehouse) => `${warehouse.name}: ${warehouse.qty}`).join(' / '),
      }
    }),
    [products],
  )

  const tabs = useMemo(
    () => tabLabels.map((tab) => ({
      ...tab,
      count: rows.filter((row) => productMatchesTab(row, tab.id)).length,
    })),
    [rows],
  )

  const filterFields = useMemo(() => [
    {
      key: 'category', label: 'Категория', type: 'select' as const,
      options: getActiveCategoryOptions().map((item) => ({ value: item.name, label: item.name })),
    },
    {
      key: 'brand', label: 'Бренд', type: 'select' as const,
      options: getActiveBrandOptions().map((item) => ({ value: item.name, label: item.name })),
    },
    { key: 'supplier', label: 'Поставщик', type: 'text' as const },
    {
      key: 'status', label: 'Статус', type: 'select' as const,
      options: [{ value: 'active', label: 'Активный' }, { value: 'inactive', label: 'Неактивный' }],
    },
  ], [])

  const filteredRows = useMemo(() => {
    const list = rows.filter((row) => productMatchesTab(row, activeTab))
    return queryItems(list, {
      page: 1,
      pageSize: Math.max(list.length, 1),
      filters: filters.values,
      search: query,
      searchKeys: ['name', 'sku', 'barcode', 'category', 'brand', 'supplier'],
    }).items
  }, [activeTab, filters.values, query, rows])

  const allSelected = filteredRows.length > 0 && filteredRows.every((item) => selectedIds.has(item.id))

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(filteredRows.map((item) => item.id)))
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="flex min-w-0 flex-col gap-7 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Каталог</h1>
        <div className="flex items-center gap-2">
          <button className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ChevronDown data-icon="inline-start" />
            Показать статистику
          </button>
          <button aria-label="Архив" className="flex size-11 items-center justify-center rounded-xl bg-card text-primary ring-1 ring-border transition-colors hover:bg-secondary">
            <Package />
          </button>
          <button onClick={() => setFieldsOpen(true)} aria-label="Настройки таблицы" className="flex size-11 items-center justify-center rounded-xl bg-card text-primary ring-1 ring-border transition-colors hover:bg-secondary">
            <SlidersHorizontal />
          </button>
        </div>
      </header>

      <div className="flex max-w-full items-center gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              activeTab === tab.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Поиск товаров</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Артикул, баркод, наименование"
            className="h-14 w-full rounded-2xl bg-secondary/60 pl-12 pr-4 text-sm text-foreground outline-none ring-1 ring-transparent placeholder:text-muted-foreground focus:bg-card focus:ring-primary/30"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <FilterPanel fields={filterFields} values={filters.values} onChange={filters.onChange} onReset={filters.onReset} />
          <button
            onClick={() => setShowBulkActions(true)}
            disabled={selectedIds.size === 0}
            className="flex h-14 items-center gap-2 rounded-2xl bg-secondary/60 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Box data-icon="inline-start" className="text-primary" />
            Действия
            {selectedIds.size > 0 ? <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{selectedIds.size}</span> : null}
          </button>
          <Link href="/tovary/create" className="flex h-14 items-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus data-icon="inline-start" />
            Создать
          </Link>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden border-y border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2050px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-14" /><col className="w-20" /><col className="w-64" /><col className="w-36" />
              <col className="w-48" /><col className="w-52" /><col className="w-52" /><col className="w-28" />
              <col className="w-48" /><col className="w-48" /><col className="w-64" />
            </colgroup>
            <thead>
              <tr className="h-16 border-b border-border text-sm font-medium text-muted-foreground">
                <th className="px-4"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Выбрать все товары" className="size-4 accent-primary" /></th>
                <th className="px-3">Фото</th>
                <th className="px-4">Наименование</th>
                <th className="px-4">Артикул</th>
                <th className="px-4">Баркод</th>
                <th className="px-4">Категория</th>
                <th className="px-4">Поставщики</th>
                <th className="px-4">Кол-во</th>
                <th className="px-4">Цена поставки</th>
                <th className="px-4">Цена поставки (USD)</th>
                <th className="border-l border-border px-5">
                  <div className="flex items-center justify-between gap-3"><span>Магазин / касса</span><button onClick={() => setFieldsOpen(true)} aria-label="Настроить колонки" className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary"><Settings2 /></button></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((product) => (
                <ProductRow key={product.id} product={product} selected={selectedIds.has(product.id)} onSelect={() => toggleSelect(product.id)} />
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-secondary"><ImageIcon className="text-muted-foreground" /></div>
              <h2 className="text-lg font-semibold text-foreground">Товары не найдены</h2>
              <button onClick={() => { setQuery(''); filters.onReset() }} className="text-sm font-semibold text-primary">Сбросить фильтры</button>
            </div>
          ) : null}
        </div>
      </div>

      {fieldsOpen ? <TableFieldsModal onClose={() => setFieldsOpen(false)} /> : null}
      {showBulkActions ? (
        <BulkActionsModal
          selectedIds={Array.from(selectedIds)}
          onClose={() => setShowBulkActions(false)}
          onApply={() => { setSelectedIds(new Set()); setProducts(readProducts()) }}
        />
      ) : null}
    </section>
  )
}

function ProductRow({ product, selected, onSelect }: { product: CatalogRow; selected: boolean; onSelect: () => void }) {
  const usdPrice = product.wholesalePrice > 0 ? product.wholesalePrice / 12600 : 0
  return (
    <tr className={cn('h-40 border-b border-border text-sm text-foreground transition-colors hover:bg-secondary/30', selected && 'bg-primary/5')}>
      <td className="px-4"><input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Выбрать ${product.name}`} className="size-4 accent-primary" /></td>
      <td className="px-3"><div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground ring-1 ring-border"><ImageIcon /></div></td>
      <td className="px-4"><Link href={`/tovary/${product.id}`} className="font-semibold text-primary hover:underline">{product.name}</Link>{product.status === 'inactive' ? <p className="mt-2 text-xs text-muted-foreground">Неактивный</p> : null}</td>
      <td className="px-4 font-medium">{product.sku}</td>
      <td className="px-4 font-medium tabular-nums">{product.barcode || '—'}</td>
      <td className="px-4">{product.category || 'Отсутствует'}</td>
      <td className="px-4">{product.supplier || '—'}</td>
      <td className="px-4 font-medium">{product.stock} {product.unit}</td>
      <td className="px-4 font-medium tabular-nums">{product.wholesalePrice > 0 ? `${formatUZS(product.wholesalePrice)} UZS` : '—'}</td>
      <td className="px-4 font-medium tabular-nums">{usdPrice > 0 ? `${usdPrice.toFixed(2)} USD` : '—'}</td>
      <td className="border-l border-border px-5">
        <div className="flex flex-col gap-2" title={product.zoneStock}>
          <StockLine icon={Package} value={`${product.storeStock} ${product.unit}`} />
          <StockLine icon={WalletCards} value={`${formatUZS(product.price)} UZS`} />
          <StockLine icon={Store} value={product.wholesalePrice > 0 ? `${formatUZS(product.wholesalePrice)} UZS` : 'Свободная цена'} />
        </div>
      </td>
    </tr>
  )
}

function StockLine({ icon: Icon, value }: { icon: typeof Package; value: string }) {
  return <div className="flex items-center gap-2 whitespace-nowrap text-sm"><span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-3" /></span><span>{value}</span></div>
}

function productMatchesTab(product: CatalogRow, tab: TabId) {
  if (tab === 'active') return product.status === 'active'
  if (tab === 'inactive') return product.status === 'inactive'
  if (tab === 'low') return product.storeStock > 0 && product.storeStock <= product.lowStockThreshold
  if (tab === 'out') return product.storeStock <= 0
  return true
}

function TableFieldsModal({ onClose }: { onClose: () => void }) {
  const fields = ['Фото', 'Наименование', 'Артикул', 'Баркод', 'Категория', 'Поставщики', 'Кол-во', 'Цена поставки', 'Цена поставки (USD)', 'Магазин / касса']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Закрыть" onClick={onClose} className="fixed inset-0 bg-foreground/40" />
      <section role="dialog" aria-modal="true" aria-labelledby="fields-title" className="relative w-full max-w-xl rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4"><h2 id="fields-title" className="text-2xl font-bold text-foreground">Поля таблицы</h2><button onClick={onClose} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Применить</button></div>
        <div className="mt-6 flex flex-col gap-2">
          {fields.map((field) => <label key={field} className="flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3 text-sm font-medium text-foreground"><input type="checkbox" defaultChecked className="size-4 accent-primary" />{field}</label>)}
        </div>
      </section>
    </div>
  )
}
