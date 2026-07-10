'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  ChevronDown,
  ChevronLeft,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Settings2,
  SlidersHorizontal,
  Tag,
  Shapes,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import {
  createBrand,
  createCategory,
  deleteBrand,
  deleteCategory,
  getActiveBrandOptions,
  getActiveCategoryOptions,
  PRODUCT_REFERENCES_CHANGED,
  readBrands,
  readCategories,
  updateBrand,
  updateCategory,
  type ProductBrand,
  type ProductCategory,
} from '@/lib/erp/categories'
import { exportCsv, exportDateStamp, exportExcel, exportJson } from '@/lib/erp/export'
import { queryItems, type SortConfig } from '@/lib/erp/storage'
import {
  DEFAULT_WAREHOUSE_ID,
  getProductWarehouseStocks,
  getWarehouseStock,
} from '@/lib/erp/erp-store'
import { FilterPanel, useFilters } from '@/components/ui/filter-panel'
import { DataPagination } from '@/components/ui/data-pagination'
import { ExportActions } from '@/components/ui/export-actions'
import { BulkActionsModal } from './bulk-actions-modal'

type TabId = 'all' | 'active' | 'inactive' | 'low' | 'out'
type SortValue = 'updated-desc' | 'updated-asc' | 'name-asc' | 'stock-desc' | 'price-desc'
type ManagerKind = 'category' | 'brand'

type CatalogRow = CatalogProduct & {
  storeStock: number
  zoneStock: string
}

const tabLabels: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'active', label: 'Активные' },
  { id: 'inactive', label: 'Неактивные' },
  { id: 'low', label: 'Малый остаток' },
  { id: 'out', label: 'Нулевой остаток' },
]

const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: 'updated-desc', label: 'Сначала новые' },
  { value: 'updated-asc', label: 'Сначала старые' },
  { value: 'name-asc', label: 'По названию' },
  { value: 'stock-desc', label: 'По остатку' },
  { value: 'price-desc', label: 'По цене' },
]

const defaultFields = [
  'Фото',
  'Наименование',
  'Артикул',
  'Баркод',
  'Категория',
  'Бренд',
  'Поставщик',
  'Остаток',
]

export function Catalog() {
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [sortValue, setSortValue] = useState<SortValue>('updated-desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [fieldsOpen, setFieldsOpen] = useState(false)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [brands, setBrands] = useState<ProductBrand[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [managerKind, setManagerKind] = useState<ManagerKind | null>(null)
  const filters = useFilters({
    category: '',
    brand: '',
    supplier: '',
    status: '',
  })

  useEffect(() => {
    function load() {
      setProducts(readProducts())
      setCategories(readCategories())
      setBrands(readBrands())
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

  useEffect(() => {
    setPage(1)
  }, [activeTab, query, sortValue, pageSize, filters.values])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [activeTab, query, sortValue, pageSize, filters.values])

  const filterFields = useMemo(
    () => [
      {
        key: 'category',
        label: 'Категория',
        type: 'select' as const,
        options: getActiveCategoryOptions().map((item) => ({
          value: item.name,
          label: item.name,
        })),
      },
      {
        key: 'brand',
        label: 'Бренд',
        type: 'select' as const,
        options: getActiveBrandOptions().map((item) => ({
          value: item.name,
          label: item.name,
        })),
      },
      {
        key: 'supplier',
        label: 'Поставщик',
        type: 'text' as const,
      },
      {
        key: 'status',
        label: 'Статус',
        type: 'select' as const,
        options: [
          { value: 'active', label: 'Активный' },
          { value: 'inactive', label: 'Неактивный' },
        ],
      },
    ],
    [categories, brands],
  )

  const rows = useMemo<CatalogRow[]>(
    () =>
      products.map((product) => {
        const warehouseStocks = getProductWarehouseStocks(product.id)
        const storeStock =
          warehouseStocks.find((warehouse) => warehouse.id === DEFAULT_WAREHOUSE_ID)?.qty ?? 0

        return {
          ...product,
          storeStock,
          zoneStock: warehouseStocks.map((warehouse) => `${warehouse.name}: ${warehouse.qty}`).join(' / '),
        }
      }),
    [products],
  )

  const tabs = useMemo(
    () =>
      tabLabels.map((tab) => ({
        ...tab,
        count: rows.filter((row) => productMatchesTab(row, tab.id)).length,
      })),
    [rows],
  )

  const filteredRows = useMemo(() => {
    const list = rows.filter((row) => productMatchesTab(row, activeTab))

    return queryItems(list, {
      page: 1,
      pageSize: Math.max(list.length, 1),
      sort: resolveSort(sortValue),
      filters: {
        category: filters.values.category,
        brand: filters.values.brand,
        supplier: filters.values.supplier,
        status: filters.values.status,
      },
      search: query,
      searchKeys: ['name', 'sku', 'barcode', 'category', 'brand', 'supplier'],
    }).items
  }, [activeTab, filters.values, query, rows, sortValue])

  const pagedRows = useMemo(
    () =>
      queryItems(filteredRows, {
        page,
        pageSize,
      }),
    [filteredRows, page, pageSize],
  )

  const allSelected =
    pagedRows.items.length > 0 && pagedRows.items.every((item) => selectedIds.has(item.id))

  const exportRows = useMemo(
    () =>
      filteredRows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode,
        category: row.category,
        brand: row.brand || '-',
        supplier: row.supplier || '-',
        unit: row.unit,
        price: row.price,
        wholesalePrice: row.wholesalePrice,
        stock: row.stock,
        storeStock: row.storeStock,
        status: row.status === 'active' ? 'Активный' : 'Неактивный',
      })),
    [filteredRows],
  )

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const item of pagedRows.items) next.delete(item.id)
        return next
      })
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const item of pagedRows.items) next.add(item.id)
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleExportCsv() {
    exportCsv(
      exportRows,
      [
        { header: 'ID', key: 'id' },
        { header: 'Наименование', key: 'name' },
        { header: 'Артикул', key: 'sku' },
        { header: 'Баркод', key: 'barcode' },
        { header: 'Категория', key: 'category' },
        { header: 'Бренд', key: 'brand' },
        { header: 'Поставщик', key: 'supplier' },
        { header: 'Ед.', key: 'unit' },
        { header: 'Цена', key: 'price', format: (value) => `${formatUZS(Number(value) || 0)} UZS` },
        {
          header: 'Оптовая цена',
          key: 'wholesalePrice',
          format: (value) => `${formatUZS(Number(value) || 0)} UZS`,
        },
        { header: 'Остаток', key: 'stock' },
        { header: 'Магазин / Подвал', key: 'storeStock' },
        { header: 'Статус', key: 'status' },
      ],
      `catalog-${exportDateStamp()}`,
    )
  }

  function handleExportExcel() {
    exportExcel(
      exportRows,
      [
        { header: 'ID', key: 'id' },
        { header: 'Наименование', key: 'name' },
        { header: 'Артикул', key: 'sku' },
        { header: 'Баркод', key: 'barcode' },
        { header: 'Категория', key: 'category' },
        { header: 'Бренд', key: 'brand' },
        { header: 'Поставщик', key: 'supplier' },
        { header: 'Ед.', key: 'unit' },
        { header: 'Цена', key: 'price', format: (value) => `${formatUZS(Number(value) || 0)} UZS` },
        {
          header: 'Оптовая цена',
          key: 'wholesalePrice',
          format: (value) => `${formatUZS(Number(value) || 0)} UZS`,
        },
        { header: 'Остаток', key: 'stock' },
        { header: 'Магазин / Подвал', key: 'storeStock' },
        { header: 'Статус', key: 'status' },
      ],
      `catalog-${exportDateStamp()}`,
      'Каталог',
    )
  }

  function handleExportJson() {
    exportJson(
      {
        generatedAt: new Date().toISOString(),
        filters: {
          query,
          tab: activeTab,
          sort: sortValue,
          ...filters.values,
        },
        total: filteredRows.length,
        items: filteredRows,
      },
      `catalog-${exportDateStamp()}`,
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Каталог товаров
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredRows.length} {filteredRows.length === 1 ? 'товар' : filteredRows.length > 4 ? 'товаров' : 'товара'} в каталоге
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary hover:text-foreground">
            <ChevronDown className="size-4" />
            Статистика
          </button>
          <button
            onClick={() => setFieldsOpen(true)}
            aria-label="Настройки таблицы"
            className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-border transition-colors hover:bg-secondary hover:text-primary"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg px-4 py-2 text-[14px] font-medium transition-all',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {tab.label}
            <span className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
              activeTab === tab.id
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-secondary text-muted-foreground',
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по артикулу, штрих-коду или наименованию..."
                className="h-11 w-full rounded-lg bg-card px-4 pr-4 text-sm text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <FilterPanel
              fields={filterFields}
              values={filters.values}
              onChange={filters.onChange}
              onReset={filters.onReset}
            />

            <div className="relative w-[200px]">
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortValue}
                onChange={(event) => setSortValue(event.target.value as SortValue)}
                className="h-11 w-full appearance-none rounded-lg bg-card pl-4 pr-9 text-sm font-medium text-foreground outline-none ring-1 ring-border transition-colors hover:bg-secondary focus:ring-2 focus:ring-primary/40"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setManagerKind('category')}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-card px-4 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Shapes className="size-4 text-primary" />
            Категории
          </button>

          <button
            onClick={() => setManagerKind('brand')}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-card px-4 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Tag className="size-4 text-primary" />
            Бренды
          </button>

          <button
            onClick={() => setShowBulkActions(true)}
            disabled={selectedIds.size === 0}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-card px-4 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Box className="size-4 text-primary" />
            Действия
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                {selectedIds.size}
              </span>
            )}
          </button>

          <Link
            href="/tovary/create"
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Создать товар
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="overflow-x-auto">
        <div className="grid min-w-[1400px] grid-cols-[44px_56px_minmax(260px,2fr)_110px_140px_130px_100px_120px_130px_130px_48px] items-center gap-4 border-b border-border bg-secondary/40 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            aria-label="Выбрать все товары"
            className="size-4 shrink-0 rounded border border-border accent-primary"
          />
          <div className="text-center">Фото</div>
          <div>Наименование</div>
          <div>Артикул</div>
          <div>Баркод</div>
          <div>Категория</div>
          <div className="text-right">Остаток</div>
          <div className="text-right">Опт цена</div>
          <div className="text-right">Розничная цена</div>
          <div className="text-right">Поставщики</div>
          <div />
        </div>
        {/* Table Header */}
        <div className="hidden">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            aria-label="Выбрать все"
            className="size-4 shrink-0 rounded border border-border accent-primary"
          />
          <div className="text-center">Фото</div>
          <div>Товар</div>
          <div>Артикул</div>
          <div className="text-center">Штрих-код</div>
          <div>Категория</div>
          <div>Поставщик</div>
          <div className="text-center">Остаток</div>
          <div className="text-center">Действия</div>
        </div>

        {/* Table Body */}
        {pagedRows.items.length > 0 ? (
          <div className="divide-y divide-border">
            {pagedRows.items.map((product) => (
              <ProductRowV2
                key={product.id}
                product={product}
                selected={selectedIds.has(product.id)}
                onSelect={() => toggleSelect(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary">
              <ImageIcon className="size-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Товары не найдены</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Измените параметры поиска или сбросьте фильтры, чтобы увидеть товары каталога.
            </p>
            <button
              onClick={() => {
                setQuery('')
                filters.onReset()
              }}
              className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
        </div>
      </div>

      <DataPagination
        page={pagedRows.page}
        totalPages={pagedRows.totalPages}
        pageSize={pagedRows.pageSize}
        total={pagedRows.total}
        onPage={setPage}
        onPageSize={setPageSize}
        pageSizeOptions={[25, 50, 100, 200]}
        exportButton={
          <ExportActions
            onCsv={handleExportCsv}
            onExcel={handleExportExcel}
            onJson={handleExportJson}
          />
        }
      />

      {fieldsOpen ? <TableFieldsModal onClose={() => setFieldsOpen(false)} /> : null}

      {showBulkActions ? (
        <BulkActionsModal
          selectedIds={Array.from(selectedIds)}
          onClose={() => setShowBulkActions(false)}
          onApply={() => {
            setSelectedIds(new Set())
            setProducts(readProducts())
          }}
        />
      ) : null}

      {managerKind ? (
        <ReferenceManagerModal
          kind={managerKind}
          categories={categories}
          brands={brands}
          onClose={() => setManagerKind(null)}
        />
      ) : null}
    </div>
  )
}

function productMatchesTab(product: CatalogRow, tab: TabId) {
  if (tab === 'active') return product.status === 'active'
  if (tab === 'inactive') return product.status === 'inactive'
  if (tab === 'low') return product.storeStock > 0 && product.storeStock <= product.lowStockThreshold
  if (tab === 'out') return product.storeStock <= 0
  return true
}

function resolveSort(value: SortValue): SortConfig<CatalogRow> {
  if (value === 'updated-asc') return { key: 'updatedAt', dir: 'asc' }
  if (value === 'name-asc') return { key: 'name', dir: 'asc' }
  if (value === 'stock-desc') return { key: 'stock', dir: 'desc' }
  if (value === 'price-desc') return { key: 'price', dir: 'desc' }
  return { key: 'updatedAt', dir: 'desc' }
}

function ProductRowV2({
  product,
  selected,
  onSelect,
}: {
  product: CatalogRow
  selected: boolean
  onSelect: () => void
}) {
  const outOfStock = product.storeStock <= 0
  const lowStock = product.storeStock > 0 && product.storeStock <= product.lowStockThreshold

  return (
    <div
      className={cn(
        'group grid min-w-[1400px] grid-cols-[44px_56px_minmax(260px,2fr)_110px_140px_130px_100px_120px_130px_130px_48px] items-center gap-4 px-5 py-3 text-sm transition-colors hover:bg-primary/[0.035]',
        selected && 'bg-primary/[0.06]',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        aria-label={`Выбрать ${product.name}`}
        className="size-4 shrink-0 rounded border border-border accent-primary"
      />

      <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/70 text-muted-foreground ring-1 ring-border/60 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <ImageIcon className="size-4" />
      </div>

      <div className="min-w-0">
        <Link
          href={`/tovary/${product.id}`}
          className="block truncate text-[14px] font-semibold leading-5 text-foreground transition-colors hover:text-primary"
        >
          {product.name}
        </Link>
        {product.status === 'inactive' && (
          <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Неактивен</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-mono text-[12px] font-semibold tracking-[0.08em] text-foreground">{product.sku}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate font-mono text-[11px] tracking-[0.1em] text-muted-foreground">{product.barcode || '—'}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{product.category}</p>
      </div>

      <div className="text-right">
        <span
          title={product.zoneStock}
          className={cn(
            'inline-flex min-w-[92px] justify-end rounded-lg px-2.5 py-1 font-mono text-[13px] font-bold tabular-nums',
            outOfStock && 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
            lowStock && 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
            !outOfStock && !lowStock && 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
          )}
        >
          {product.storeStock} {product.unit}
        </span>
      </div>

      <div className="text-right">
        <p className="whitespace-nowrap font-mono text-[13px] font-bold tabular-nums text-foreground">
          {product.wholesalePrice > 0 ? `${formatUZS(product.wholesalePrice)} UZS` : '—'}
        </p>
      </div>

      <div className="text-right">
        <p className="whitespace-nowrap font-mono text-[13px] font-bold tabular-nums text-foreground">
          {formatUZS(product.price)} <span className="text-[11px] font-semibold text-muted-foreground">UZS</span>
        </p>
      </div>

      <div className="text-right">
        <p className="truncate text-[13px] text-muted-foreground">
          {product.supplier || '—'}
        </p>
      </div>

      <Link
        href={`/tovary/${product.id}/edit`}
        aria-label="Редактировать товар"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-secondary hover:text-primary focus:opacity-100 group-hover:opacity-100"
      >
        <Pencil className="size-4" />
      </Link>
    </div>
  )
}

function ProductRow({
  product,
  selected,
  onSelect,
}: {
  product: CatalogRow
  selected: boolean
  onSelect: () => void
}) {
  const outOfStock = product.storeStock <= 0
  const lowStock = product.storeStock > 0 && product.storeStock <= product.lowStockThreshold
  const inStock = product.storeStock > product.lowStockThreshold

  return (
    <div
      className={cn(
        'group grid min-w-[1060px] grid-cols-[40px_minmax(320px,2fr)_130px_170px_150px_150px_110px_48px] items-center gap-4 px-5 py-3 text-sm transition-colors hover:bg-primary/[0.035]',
        selected && 'bg-primary/5',
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        aria-label={`Выбрать ${product.name}`}
        className="size-4 shrink-0 rounded border border-border accent-primary"
      />

      {/* Product Info */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/70 text-muted-foreground ring-1 ring-border/60">
          <ImageIcon className="size-4 opacity-60" />
        </div>
        <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/tovary/${product.id}`}
            className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
          >
            {product.name}
          </Link>
          {product.status === 'inactive' && (
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
              Неактивный
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 tabular-nums text-[13px] font-bold text-primary">
            {formatUZS(product.price)} UZS
          </span>
          {product.wholesalePrice > 0 && (
            <span className="text-[12px] text-muted-foreground">
              опт: {formatUZS(product.wholesalePrice)}
            </span>
          )}
        </div>
      </div>
      </div>

      {/* SKU */}
      <div className="text-center">
        <span className="font-mono text-[13px] font-medium text-foreground">{product.sku}</span>
      </div>

      {/* Barcode */}
      <div className="text-center">
        <span className="font-mono text-[12px] text-muted-foreground">
          {product.barcode || '—'}
        </span>
      </div>

      {/* Category & Brand */}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{product.category}</p>
        {product.brand && (
          <p className="truncate text-[12px] text-muted-foreground">{product.brand}</p>
        )}
      </div>

      {/* Supplier */}
      <div className="min-w-0">
        <p className="truncate text-[13px] text-muted-foreground">
          {product.supplier || '—'}
        </p>
      </div>

      {/* Stock */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={cn(
            'flex min-w-[80px] items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold',
            outOfStock && 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
            lowStock && 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
            inStock && 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
          )}
          title={product.zoneStock}
        >
          <span className="font-mono text-[13px]">
            {product.stock} {product.unit}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">Магазин: {product.storeStock}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-1">
        <Link
          href={`/tovary/${product.id}/edit`}
          aria-label="Редактировать"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-secondary hover:text-primary group-hover:opacity-100"
        >
          <Pencil className="size-4" />
        </Link>
      </div>
    </div>
  )
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-secondary p-1">
      <button
        onClick={() => onChange(true)}
        className={cn(
          'rounded-xl py-3 text-[15px] font-semibold transition-colors',
          value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Да
      </button>
      <button
        onClick={() => onChange(false)}
        className={cn(
          'rounded-xl py-3 text-[15px] font-semibold transition-colors',
          !value ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Нет
      </button>
    </div>
  )
}

function TableFieldsModal({ onClose }: { onClose: () => void }) {
  const [groupVariations, setGroupVariations] = useState(true)
  const [byStores, setByStores] = useState(true)
  const [fields, setFields] = useState(defaultFields)
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultFields.map((field) => [field, true])),
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const allChecked = fields.every((field) => checked[field])

  function toggleAll() {
    const next = !allChecked
    setChecked(Object.fromEntries(fields.map((field) => [field, next])))
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...fields]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setFields(next)
    setDragIndex(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 border-b border-border p-5">
          <button
            onClick={onClose}
            aria-label="Назад"
            className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-black text-foreground">Поля таблицы</h2>
          <button
            onClick={onClose}
            className="rounded-2xl bg-primary px-8 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Применить
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-[15px] font-medium text-muted-foreground">Группировать вариации</p>
              <Toggle value={groupVariations} onChange={setGroupVariations} />
            </div>
            <div className="space-y-3">
              <p className="text-[15px] font-medium text-muted-foreground">Отображение по магазинам</p>
              <Toggle value={byStores} onChange={setByStores} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="size-5 rounded-md border border-border accent-primary"
            />
            <span className="text-[15px] font-medium text-foreground">Выделить все</span>
          </label>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={cn(
                  'flex items-center justify-between rounded-2xl bg-secondary px-4 py-4 transition-opacity',
                  dragIndex === index && 'opacity-50',
                )}
              >
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[field])}
                    onChange={() => setChecked((prev) => ({ ...prev, [field]: !prev[field] }))}
                    className="size-5 rounded-md border border-border accent-primary"
                  />
                  <span className="text-[15px] font-medium text-foreground">{field}</span>
                </label>
                <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                  <GripVertical className="size-5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReferenceManagerModal({
  kind,
  categories,
  brands,
  onClose,
}: {
  kind: ManagerKind
  categories: ProductCategory[]
  brands: ProductBrand[]
  onClose: () => void
}) {
  const isCategory = kind === 'category'
  const items = isCategory ? categories : brands
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [parentId, setParentId] = useState('')
  const [error, setError] = useState('')

  const activeParents = useMemo(
    () => categories.filter((item) => item.status === 'active' && !item.parentId),
    [categories],
  )

  function resetForm() {
    setEditingId(null)
    setName('')
    setCountry('')
    setParentId('')
    setError('')
  }

  function startEdit(item: ProductCategory | ProductBrand) {
    setEditingId(item.id)
    setName(item.name)
    setError('')

    if (isCategory) {
      setParentId((item as ProductCategory).parentId ?? '')
      setCountry('')
    } else {
      setCountry((item as ProductBrand).country ?? '')
      setParentId('')
    }
  }

  function submit() {
    try {
      if (isCategory) {
        if (editingId) {
          updateCategory({
            id: editingId,
            name,
            parentId: parentId || null,
          })
        } else {
          createCategory({
            name,
            parentId: parentId || null,
          })
        }
      } else if (editingId) {
        updateBrand({
          id: editingId,
          name,
          country,
        })
      } else {
        createBrand({
          name,
          country,
        })
      }

      resetForm()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось сохранить запись.')
    }
  }

  function archive(id: string) {
    if (isCategory) deleteCategory(id)
    else deleteBrand(id)

    if (editingId === id) resetForm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-4xl rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-2xl font-black text-foreground">
              {isCategory ? 'Категории' : 'Бренды'}
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {isCategory
                ? 'Управление категориями каталога'
                : 'Управление брендами каталога'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl bg-secondary px-5 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
          >
            Закрыть
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-foreground">{item.name}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {isCategory
                        ? (item as ProductCategory).parentId
                          ? activeParents.find((parent) => parent.id === (item as ProductCategory).parentId)?.name || 'Подкатегория'
                          : 'Основная категория'
                        : (item as ProductBrand).country || 'Страна не указана'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-primary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => archive(item.id)}
                      className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-secondary px-5 py-8 text-center text-[15px] text-muted-foreground">
                Справочник пока пуст.
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-secondary/60 p-5 ring-1 ring-border">
            <h3 className="text-lg font-bold text-foreground">
              {editingId
                ? `Редактировать ${isCategory ? 'категорию' : 'бренд'}`
                : `Новый ${isCategory ? 'элемент категории' : 'бренд'}`}
            </h3>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-muted-foreground">Название</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-2xl bg-card px-4 text-[15px] text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {isCategory ? (
                <div className="space-y-2">
                  <label className="text-[14px] font-medium text-muted-foreground">Родитель</label>
                  <div className="relative">
                    <select
                      value={parentId}
                      onChange={(event) => setParentId(event.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl bg-card px-4 pr-10 text-[15px] text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Без родителя</option>
                      {activeParents
                        .filter((item) => item.id !== editingId)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[14px] font-medium text-muted-foreground">Страна</label>
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="h-12 w-full rounded-2xl bg-card px-4 text-[15px] text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              {error ? (
                <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-semibold text-destructive ring-1 ring-destructive/20">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 rounded-2xl bg-card px-4 py-3 text-[15px] font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
                >
                  Очистить
                </button>
                <button
                  onClick={submit}
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
