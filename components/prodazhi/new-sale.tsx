'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  ArrowLeftRight,
  History,
  Plus,
  StickyNote,
  Users,
  Minus,
  Pencil,
  Trash2,
  ImageIcon,
  ScanLine,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  defaultSeller,
  formatChip,
  formatFixed,
} from './pos-data'
import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import {
  completeSale,
  createClient,
  DEFAULT_WAREHOUSE_ID,
  getPopularProducts,
  getStoreRestockSuggestions,
  getWarehouseStock,
  type ErpSalePayment,
  type ErpSeller,
} from '@/lib/erp/erp-store'
import { SellerModal } from './seller-modal'
import { ClientModal } from './client-modal'
import { PaymentView } from './payment-view'
import { ExchangeModal } from './exchange-modal'
import { DeferModal } from './defer-modal'
import { SalesHistoryModal } from './sales-history-modal'
import { BarcodeScannerModal } from './barcode-scanner-modal'
import { searchProducts } from '@/lib/utils/fuzzy-search'

type CartLine = { product: CatalogProduct; qty: number; seller: string }
type RestockAction = {
  href: string
  label: string
  productId: string
  desiredQty: number
}

type PosRestockDraft = {
  orderNumber: string
  lines: Array<{ productId: string; qty: number; seller: string }>
  wholesale: boolean
  discountUnit: '%' | 'UZS'
  discountValue: string
  note: string
  client: string | null
  desiredProductId: string
  desiredQty: number
}

const percentPresets = [15, 30, 50, 75]
const fixedPresets = [50000, 100000, 500000, 1000000]
const POS_RESTOCK_DRAFT_KEY = 'erp.pos.restockDraft.v1'

function randomOrder() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function makeRestockAction(
  product: CatalogProduct,
  sourceWarehouseId: string,
  qty: number,
): RestockAction {
  const params = new URLSearchParams({
    from: sourceWarehouseId,
    product: product.id,
    qty: String(Math.max(1, Math.floor(qty))),
    returnTo: '/prodazhi',
  })

  return {
    href: `/tovary/transfer/${Date.now()}?${params.toString()}`,
    label: 'Создать перемещение',
    productId: product.id,
    desiredQty: Math.max(1, Math.floor(qty)),
  }
}

export function NewSale() {
  const [orderNumber, setOrderNumber] = useState(() => randomOrder())
  const [productCatalog, setProductCatalog] = useState<CatalogProduct[]>([])
  const [popularProducts, setPopularProducts] = useState<CatalogProduct[]>([])
  const [lines, setLines] = useState<CartLine[]>([])
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [wholesale, setWholesale] = useState(false)
  const [discountUnit, setDiscountUnit] = useState<'%' | 'UZS'>('%')
  const [discountValue, setDiscountValue] = useState('')
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [client, setClient] = useState<string | null>(null)
  const [clientQuery, setClientQuery] = useState('')
  const [seller, setSeller] = useState<ErpSeller | null>(null)
  const [showSellerModal, setShowSellerModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showExchange, setShowExchange] = useState(false)
  const [showDefer, setShowDefer] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [deferred, setDeferred] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutSuccess, setCheckoutSuccess] = useState('')
  const [restockAction, setRestockAction] = useState<RestockAction | null>(null)
  const draftRestored = useRef(false)
  const barcodeBufferRef = useRef('')
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastKeypressRef = useRef(0)

  useEffect(() => {
    function loadProducts() {
      setProductCatalog(readProducts().filter((product) => product.status === 'active'))
      setPopularProducts(getPopularProducts(10))
    }

    loadProducts()
    window.addEventListener(PRODUCT_CATALOG_CHANGED, loadProducts)
    window.addEventListener('storage', loadProducts)

    return () => {
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, loadProducts)
      window.removeEventListener('storage', loadProducts)
    }
  }, [])

  useEffect(() => {
    if (draftRestored.current || productCatalog.length === 0) return
    draftRestored.current = true

    const raw = window.sessionStorage.getItem(POS_RESTOCK_DRAFT_KEY)
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as PosRestockDraft
      const productsById = new Map(productCatalog.map((product) => [product.id, product]))
      const nextLines = draft.lines
        .map((line) => {
          const product = productsById.get(line.productId)
          if (!product) return null

          const available = getWarehouseStock(product.id, DEFAULT_WAREHOUSE_ID)
          const qty = Math.min(line.qty, available)
          if (qty <= 0) return null

          return { product, qty, seller: line.seller }
        })
        .filter((line): line is CartLine => Boolean(line))

      const desiredProduct = productsById.get(draft.desiredProductId)
      if (desiredProduct) {
        const available = getWarehouseStock(desiredProduct.id, DEFAULT_WAREHOUSE_ID)
        const desiredQty = Math.min(draft.desiredQty, available)
        if (desiredQty > 0) {
          const index = nextLines.findIndex(
            (line) => line.product.id === desiredProduct.id,
          )
          if (index >= 0) {
            nextLines[index] = { ...nextLines[index], qty: desiredQty }
          } else {
            nextLines.push({
              product: desiredProduct,
              qty: desiredQty,
              seller: seller?.name ?? defaultSeller,
            })
          }
        }
      }

      setOrderNumber(draft.orderNumber)
      setLines(nextLines)
      setWholesale(draft.wholesale)
      setDiscountUnit(draft.discountUnit)
      setDiscountValue(draft.discountValue)
      setNote(draft.note)
      setClient(draft.client)
      setCheckoutError('')
      setRestockAction(null)
      window.sessionStorage.removeItem(POS_RESTOCK_DRAFT_KEY)
    } catch {
      window.sessionStorage.removeItem(POS_RESTOCK_DRAFT_KEY)
    }
  }, [productCatalog, seller])

  // Global USB barcode scanner listener
  useEffect(() => {
    function handleGlobalScan(e: KeyboardEvent) {
      // Игнорируем, если фокус на input/textarea или открыта модалка
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        showScanner ||
        showPayment ||
        showExchange ||
        showDefer ||
        showHistory ||
        showSellerModal ||
        showClientModal
      ) {
        return
      }

      const now = Date.now()
      const timeSinceLastKey = now - lastKeypressRef.current
      lastKeypressRef.current = now

      // Определяем быстрый ввод от USB-сканера (менее 50ms между символами)
      if (timeSinceLastKey > 100) {
        barcodeBufferRef.current = ''
      }

      if (e.key === 'Enter' && barcodeBufferRef.current.length > 0) {
        e.preventDefault()
        const barcode = barcodeBufferRef.current.trim()
        barcodeBufferRef.current = ''

        const product = productCatalog.find(
          (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase(),
        )

        if (product) {
          addProduct(product)
          setCheckoutSuccess(`Товар "${product.name}" добавлен сканером`)
          setTimeout(() => setCheckoutSuccess(''), 2000)
        } else {
          setCheckoutError(`Товар с кодом "${barcode}" не найден`)
          setTimeout(() => setCheckoutError(''), 3000)
        }
        return
      }

      // Накапливаем символы от сканера
      if (e.key.length === 1 && timeSinceLastKey < 50) {
        barcodeBufferRef.current += e.key
      }

      // Сбрасываем буфер через 100ms после последнего символа
      clearTimeout(barcodeTimeoutRef.current)
      barcodeTimeoutRef.current = setTimeout(() => {
        barcodeBufferRef.current = ''
      }, 100)
    }

    window.addEventListener('keydown', handleGlobalScan)
    return () => {
      window.removeEventListener('keydown', handleGlobalScan)
      clearTimeout(barcodeTimeoutRef.current)
    }
  }, [
    productCatalog,
    showScanner,
    showPayment,
    showExchange,
    showDefer,
    showHistory,
    showSellerModal,
    showClientModal,
    addProduct,
  ])

  const totalQty = lines.reduce((s, l) => s + l.qty, 0)
  const subtotal = lines.reduce(
    (s, l) => s + l.qty * (wholesale ? l.product.wholesalePrice || l.product.price : l.product.price),
    0,
  )

  const discountAmount = useMemo(() => {
    const v = Number(discountValue) || 0
    if (discountUnit === '%') return Math.round((subtotal * v) / 100)
    return Math.min(v, subtotal)
  }, [discountValue, discountUnit, subtotal])

  const total = Math.max(0, subtotal - discountAmount)

  const searchResults = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return searchProducts(productCatalog, q, 6)
  }, [productCatalog, query])

  function addProduct(p: CatalogProduct) {
    const storeStock = getWarehouseStock(p.id, DEFAULT_WAREHOUSE_ID)
    if (storeStock <= 0) {
      const suggestion = getStoreRestockSuggestions(p.id)[0]
      setRestockAction(suggestion ? makeRestockAction(p, suggestion.id, 1) : null)
      setCheckoutError(
        suggestion
          ? `В магазине нет. Есть в зоне "${suggestion.name}": ${suggestion.qty} ${p.unit}. Нужно переместить в магазин.`
          : 'Товара нет в магазине и на складах.',
      )
      return
    }
    setCheckoutError('')
    setCheckoutSuccess('')
    setRestockAction(null)
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === p.id)
      if (existing) {
        if (existing.qty >= storeStock) {
          const suggestion = getStoreRestockSuggestions(p.id, existing.qty + 1)[0]
          setRestockAction(
            suggestion ? makeRestockAction(p, suggestion.id, existing.qty + 1 - storeStock) : null,
          )
          setCheckoutError(
            suggestion
              ? `В магазине доступно ${storeStock} ${p.unit}. Еще есть в зоне "${suggestion.name}": ${suggestion.qty} ${p.unit}.`
              : `В магазине доступно только ${storeStock} ${p.unit}.`,
          )
        }
        return prev.map((l) =>
          l.product.id === p.id
            ? { ...l, qty: Math.min(l.qty + 1, storeStock) }
            : l,
        )
      }
      return [...prev, { product: p, qty: 1, seller: seller?.name ?? defaultSeller }]
    })
    setQuery('')
    setSearchFocused(false)
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.product.id !== id))
      return
    }
    setLines((prev) =>
      prev.map((l) => {
        if (l.product.id !== id) return l

        const storeStock = getWarehouseStock(l.product.id, DEFAULT_WAREHOUSE_ID)
        if (qty > storeStock) {
          const suggestion = getStoreRestockSuggestions(l.product.id, qty)[0]
          setRestockAction(
            suggestion ? makeRestockAction(l.product, suggestion.id, qty - storeStock) : null,
          )
          setCheckoutError(
            suggestion
              ? `В магазине доступно ${storeStock} ${l.product.unit}. Есть в зоне "${suggestion.name}": ${suggestion.qty} ${l.product.unit}.`
              : `В магазине доступно только ${storeStock} ${l.product.unit}.`,
          )
        } else {
          setCheckoutError('')
          setRestockAction(null)
        }

        return { ...l, qty: Math.min(qty, storeStock) }
      }),
    )
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== id))
  }

  function saveRestockDraft(action: RestockAction) {
    const draft: PosRestockDraft = {
      orderNumber,
      lines: lines.map((line) => ({
        productId: line.product.id,
        qty: line.qty,
        seller: line.seller,
      })),
      wholesale,
      discountUnit,
      discountValue,
      note,
      client,
      desiredProductId: action.productId,
      desiredQty: action.desiredQty,
    }

    window.sessionStorage.setItem(POS_RESTOCK_DRAFT_KEY, JSON.stringify(draft))
  }

  function applyPreset(amount: number) {
    setDiscountUnit('UZS')
    setDiscountValue(String(amount))
  }

  function resetSale() {
    setLines([])
    setDiscountValue('')
    setNote('')
    setShowNote(false)
    setClient(null)
    setClientQuery('')
    setShowPayment(false)
    setDeferred(false)
    setOrderNumber(randomOrder())
    setCheckoutError('')
    setRestockAction(null)
  }

  function handleComplete(payments: ErpSalePayment[]) {
    try {
      completeSale({
        orderNumber,
        client,
        seller: seller?.name ?? defaultSeller,
        saleChannel: wholesale ? 'wholesale' : 'retail',
        subtotal,
        discount: discountAmount,
        total,
        note,
        lines: lines.map((line) => ({
          product: line.product,
          qty: line.qty,
          unitPrice: wholesale
            ? line.product.wholesalePrice || line.product.price
            : line.product.price,
          priceType: wholesale ? 'wholesale' : 'retail',
        })),
        payments,
      })
      resetSale()
    } catch (error) {
      setShowPayment(false)
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'Не удалось завершить продажу.',
      )
    }
  }

  if (showPayment) {
    return (
      <>
        <PaymentView
          lines={lines}
          total={total}
          discount={discountAmount}
          orderNumber={orderNumber}
          client={client}
          seller={seller?.name ?? defaultSeller}
          wholesale={wholesale}
          onBack={() => setShowPayment(false)}
          onComplete={handleComplete}
        />
      </>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      {/* Left: cart */}
      <div className="space-y-6">
        {/* Search row */}
        {checkoutError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
            <span>{checkoutError}</span>
            {restockAction ? (
              <Link
                href={restockAction.href}
                onClick={() => saveRestockDraft(restockAction)}
                className="rounded-xl bg-card px-4 py-2 text-[14px] font-bold text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
              >
                {restockAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
        {checkoutSuccess ? (
          <div className="rounded-2xl bg-primary/10 px-5 py-4 text-[15px] font-semibold text-primary ring-1 ring-primary/20">
            {checkoutSuccess}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Товар, артикул, штрихкод"
              className="h-14 w-full rounded-2xl bg-card pl-14 pr-24 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
            {!query && (
              <span className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[14px] text-muted-foreground">
                Нажмите
                <kbd className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground ring-1 ring-border">
                  /
                </kbd>
              </span>
            )}

            {/* Search dropdown */}
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-16 z-30 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addProduct(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                      <ImageIcon className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-semibold text-foreground">
                        {p.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {p.sku} / {p.barcode}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Магазин/Подвал: {getWarehouseStock(p.id, DEFAULT_WAREHOUSE_ID)} {p.unit}
                      </span>
                    </span>
                    <span className="text-[15px] font-bold text-primary">
                      {formatUZS(wholesale ? p.wholesalePrice || p.price : p.price)} UZS
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            aria-label="Возврат / обмен"
            onClick={() => setShowExchange(true)}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <ArrowLeftRight className="size-5" />
          </button>
          <button
            aria-label="История"
            onClick={() => setShowHistory(true)}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <History className="size-5" />
          </button>
          <button
            aria-label="Сканировать"
            onClick={() => setShowScanner(true)}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <ScanLine className="size-5" />
          </button>
        </div>

        {/* Popular products */}
        {popularProducts.length > 0 && lines.length === 0 && !query && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">
                Популярные товары
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                ТОП {popularProducts.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
              {popularProducts.map((product) => {
                const stock = getWarehouseStock(product.id, DEFAULT_WAREHOUSE_ID)
                const price = wholesale ? product.wholesalePrice || product.price : product.price

                return (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    disabled={stock <= 0}
                    className="group relative flex flex-col gap-2 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border transition-all hover:shadow-md hover:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <ImageIcon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-muted-foreground">
                        {product.sku}
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                        {stock > 0 ? `${stock} ${product.unit}` : 'Нет на складе'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-primary">
                        {formatUZS(price)} UZS
                      </span>
                      <Plus className="size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Cart header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Корзина
            </h1>
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-[15px] font-bold text-muted-foreground">
              {totalQty}
            </span>
            {totalQty > 0 && (
              <button
                aria-label="Очистить корзину"
                onClick={() => setLines([])}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-danger"
              >
                <Trash2 className="size-5" />
              </button>
            )}
            <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-2.5 shadow-sm ring-1 ring-border">
              <span className="text-[15px] font-medium text-foreground">
                Оптовые цены
              </span>
              <button
                role="switch"
                aria-checked={wholesale}
                onClick={() => setWholesale((v) => !v)}
                className={cn(
                  'relative h-7 w-12 rounded-full transition-colors',
                  wholesale ? 'bg-primary' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 size-5 rounded-full bg-card shadow transition-transform',
                    wholesale ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
          </div>
          <span className="text-2xl font-black text-muted-foreground/50">
            #{orderNumber}
          </span>
        </div>

        {/* Seller chips */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => seller && setSeller(null)}
            className={cn(
              'rounded-2xl px-6 py-3 text-[15px] font-semibold shadow-md transition-colors',
              seller
                ? 'bg-secondary text-foreground shadow-none ring-1 ring-border hover:bg-accent'
                : 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90',
            )}
          >
            Все продавцы
          </button>
          {seller && (
            <span className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30">
              {seller.name}
              <button
                aria-label="Убрать продавца"
                onClick={() => setSeller(null)}
                className="text-primary-foreground/80 hover:text-primary-foreground"
              >
                <X className="size-4" />
              </button>
            </span>
          )}
          <button
            aria-label="Добавить продавца"
            onClick={() => setShowSellerModal(true)}
            className="flex size-11 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {/* Cart body */}
        {lines.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-bold text-foreground">
              Корзина пока что пустая
            </h2>
            <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">
              Нажмите &quot;/&quot; для поиска товаров или отсканируйте товар
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => (
              <div
                key={l.product.id}
                className="flex items-center gap-4 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border"
              >
                {/* Qty stepper */}
                <div className="flex items-center gap-1 rounded-2xl bg-secondary px-2 py-1.5">
                  <span className="min-w-14 text-center text-[15px] font-semibold text-foreground">
                    {l.qty} шт
                  </span>
                  <div className="flex flex-col">
                    <button
                      aria-label="Увеличить"
                      onClick={() => setQty(l.product.id, l.qty + 1)}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      aria-label="Уменьшить"
                      onClick={() => setQty(l.product.id, l.qty - 1)}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Minus className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail */}
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <ImageIcon className="size-6" />
                </span>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-foreground">
                    {l.product.name}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {l.product.sku} / {l.product.barcode}
                  </p>
                </div>

                {/* Price + seller */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold text-primary">
                    {formatUZS(wholesale ? l.product.wholesalePrice || l.product.price : l.product.price)} UZS
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" />
                    {l.seller}
                  </span>
                </div>

                {/* Delete */}
                <button
                  aria-label="Удалить товар"
                  onClick={() => removeLine(l.product.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-danger"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: checkout panel */}
      <aside className="space-y-5 self-start rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
        {/* Client */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-foreground">
                Клиент
              </span>
              <kbd className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground ring-1 ring-border">
                J
              </kbd>
            </div>
            <button
              onClick={() => setShowClientModal(true)}
              className="text-[15px] font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Добавить
            </button>
          </div>
          {client ? (
            <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <Users className="size-5 text-primary" />
                {client}
              </span>
              <button
                aria-label="Убрать клиента"
                onClick={() => setClient(null)}
                className="text-muted-foreground transition-colors hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !e.nativeEvent.isComposing &&
                    clientQuery.trim()
                  ) {
                    setClient(clientQuery.trim())
                    setClientQuery('')
                  }
                }}
                placeholder="Имя или номер клиента"
                className="h-12 w-full rounded-2xl bg-secondary pl-12 pr-4 text-[15px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}
        </div>

        {/* Discount */}
        {wholesale ? (
          <div className="rounded-2xl bg-primary/10 px-4 py-3 text-[14px] font-semibold text-primary ring-1 ring-primary/20">
            Оптовая продажа{client ? ` · ${client}` : ' · клиент не выбран'}
          </div>
        ) : null}

        {/* Discount */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">
              Скидка
            </span>
            <kbd className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground ring-1 ring-border">
              K
            </kbd>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={discountValue}
              onChange={(e) =>
                setDiscountValue(e.target.value.replace(/[^0-9]/g, ''))
              }
              inputMode="numeric"
              placeholder="Введите скидку"
              className="h-12 flex-1 rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex h-12 items-center rounded-2xl bg-secondary p-1 ring-1 ring-border">
              {(['%', 'UZS'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setDiscountUnit(u)}
                  className={cn(
                    'flex h-full items-center rounded-xl px-4 text-[15px] font-semibold transition-colors',
                    discountUnit === u
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {subtotal > 0
              ? percentPresets.map((p) => {
                  const amount = Math.round((subtotal * p) / 100)
                  return (
                    <button
                      key={p}
                      onClick={() => applyPreset(amount)}
                      className="rounded-2xl bg-secondary py-2.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      {formatChip(amount)}
                    </button>
                  )
                })
              : fixedPresets.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => applyPreset(amount)}
                    className="rounded-2xl bg-secondary py-2.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    {formatFixed(amount)}
                  </button>
                ))}
          </div>
        </div>

        {/* Note */}
        {showNote ? (
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => !note.trim() && setShowNote(false)}
            placeholder="Введите заметку"
            rows={3}
            className="w-full resize-none rounded-2xl bg-secondary px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        ) : (
          <button
            onClick={() => setShowNote(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[15px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <StickyNote className="size-5" />
            Добавить заметку
          </button>
        )}

        {/* Totals */}
        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-center justify-between text-[15px]">
            <span className="text-muted-foreground">Подытог</span>
            <span className="font-semibold text-foreground">
              {formatUZS(subtotal)} UZS
            </span>
          </div>
          <div className="flex items-center justify-between text-[15px]">
            <span className="text-muted-foreground">Скидка</span>
            <span className="font-semibold text-foreground">
              {formatUZS(discountAmount)} UZS
            </span>
          </div>
        </div>

        {/* Pay */}
        <button
          onClick={() => lines.length > 0 && setShowPayment(true)}
          disabled={lines.length === 0}
          className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            Оплатить
            <kbd className="flex size-6 items-center justify-center rounded-md bg-primary-foreground/20 text-xs font-semibold">
              L
            </kbd>
          </span>
          <span>{formatUZS(total)} UZS</span>
        </button>

        <button
          onClick={() => lines.length > 0 && setShowDefer(true)}
          disabled={lines.length === 0}
          className="flex w-full items-center justify-center gap-2 py-2 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deferred ? 'Продажа отложена' : 'Отложить'}
          <kbd className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground ring-1 ring-border">
            O
          </kbd>
        </button>
      </aside>

      {/* Modals */}
      <SellerModal
        open={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        onSelect={(s) => {
          setSeller(s)
          setShowSellerModal(false)
        }}
      />
      <ClientModal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        onCreate={(clientDraft) => {
          const createdClient = createClient(clientDraft)
          setClient(createdClient.name)
          setShowClientModal(false)
        }}
      />
      <ExchangeModal
        open={showExchange}
        onClose={() => setShowExchange(false)}
        exchangeDraft={
          lines.length > 0
            ? {
                orderNumber,
                client,
                seller: seller?.name ?? defaultSeller,
                wholesale,
                subtotal,
                discount: discountAmount,
                total,
                note,
                lines: lines.map((line) => ({
                  product: line.product,
                  qty: line.qty,
                })),
              }
            : null
        }
        onReturned={(saleReturn) => {
          setCheckoutError('')
          setCheckoutSuccess(`Возврат #${saleReturn.id} завершен.`)
        }}
        onExchanged={({ exchangeSale }) => {
          setCheckoutError('')
          setCheckoutSuccess(`Обмен #${exchangeSale.id} завершен.`)
          resetSale()
        }}
      />
      <SalesHistoryModal open={showHistory} onClose={() => setShowHistory(false)} />
      <BarcodeScannerModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={(product) => {
          addProduct(product)
          setShowScanner(false)
        }}
      />
      <DeferModal
        open={showDefer}
        onClose={() => setShowDefer(false)}
        onDefer={() => {
          setShowDefer(false)
          setDeferred(true)
          setTimeout(resetSale, 1200)
        }}
      />
    </div>
  )
}

