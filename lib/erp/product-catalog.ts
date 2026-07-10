import { findBrandReference, findCategoryReference } from './categories'

export type ProductStatus = 'active' | 'inactive'

export type CatalogProduct = {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  categoryId?: string
  brand?: string
  brandId?: string
  supplier?: string
  unit: string
  price: number
  wholesalePrice: number
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type ProductDraft = Pick<
  CatalogProduct,
  | 'name'
  | 'sku'
  | 'barcode'
  | 'category'
  | 'categoryId'
  | 'brand'
  | 'brandId'
  | 'supplier'
  | 'unit'
  | 'price'
  | 'wholesalePrice'
  | 'stock'
  | 'lowStockThreshold'
  | 'status'
>

const STORAGE_KEY = 'erp.productCatalog.v1'
export const PRODUCT_CATALOG_CHANGED = 'erp:product-catalog-changed'

// nosemgrep: hardcoded-credentials
// Seed data contains product barcodes, not credentials
export const seedProducts: CatalogProduct[] = [
  {
    id: 'p1',
    name: 'Казан алюминиевый 8 л',
    sku: 'KZN-AL-008',
    barcode: '2000000010001',
    category: 'Казаны',
    brand: 'Узбекистан',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 185000,
    wholesalePrice: 160000,
    stock: 24,
    lowStockThreshold: 5,
    status: 'active',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'Казан чугунный 12 л',
    sku: 'KZN-CH-012',
    barcode: '2000000010002',
    category: 'Казаны',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 420000,
    wholesalePrice: 370000,
    stock: 10,
    lowStockThreshold: 3,
    status: 'active',
    createdAt: '2026-07-01T09:05:00.000Z',
    updatedAt: '2026-07-01T09:05:00.000Z',
  },
  {
    id: 'p3',
    name: 'Сковорода антипригарная 28 см',
    sku: 'SKV-AP-028',
    barcode: '2000000010003',
    category: 'Сковороды',
    brand: 'Tefal',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 320000,
    wholesalePrice: 280000,
    stock: 18,
    lowStockThreshold: 5,
    status: 'active',
    createdAt: '2026-07-01T09:10:00.000Z',
    updatedAt: '2026-07-01T09:10:00.000Z',
  },
  {
    id: 'p4',
    name: 'Сковорода чугунная 24 см',
    sku: 'SKV-CH-024',
    barcode: '2000000010004',
    category: 'Сковороды',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 210000,
    wholesalePrice: 180000,
    stock: 14,
    lowStockThreshold: 4,
    status: 'active',
    createdAt: '2026-07-01T09:15:00.000Z',
    updatedAt: '2026-07-01T09:15:00.000Z',
  },
  {
    id: 'p5',
    name: 'Кастрюля нержавеющая 5 л',
    sku: 'KST-NZ-005',
    barcode: '2000000010005',
    category: 'Кастрюли',
    brand: 'Rondell',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 275000,
    wholesalePrice: 240000,
    stock: 20,
    lowStockThreshold: 5,
    status: 'active',
    createdAt: '2026-07-01T09:20:00.000Z',
    updatedAt: '2026-07-01T09:20:00.000Z',
  },
  {
    id: 'p6',
    name: 'Кастрюля эмалированная 3 л',
    sku: 'KST-EM-003',
    barcode: '2000000010006',
    category: 'Кастрюли',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 95000,
    wholesalePrice: 80000,
    stock: 3,
    lowStockThreshold: 8,
    status: 'active',
    createdAt: '2026-07-01T09:25:00.000Z',
    updatedAt: '2026-07-01T09:25:00.000Z',
  },
  {
    id: 'p7',
    name: 'Чайник электрический 1.7 л',
    sku: 'CHY-EL-017',
    barcode: '2000000010007',
    category: 'Чайники',
    brand: 'Philips',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 380000,
    wholesalePrice: 330000,
    stock: 12,
    lowStockThreshold: 4,
    status: 'active',
    createdAt: '2026-07-01T09:30:00.000Z',
    updatedAt: '2026-07-01T09:30:00.000Z',
  },
  {
    id: 'p8',
    name: 'Чайник заварочный стеклянный 1 л',
    sku: 'CHY-ZV-010',
    barcode: '2000000010008',
    category: 'Чайники',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 75000,
    wholesalePrice: 62000,
    stock: 0,
    lowStockThreshold: 6,
    status: 'active',
    createdAt: '2026-07-01T09:35:00.000Z',
    updatedAt: '2026-07-01T09:35:00.000Z',
  },
  {
    id: 'p9',
    name: 'Нож поварской 20 см',
    sku: 'NZH-PV-020',
    barcode: '2000000010009',
    category: 'Ножи',
    brand: 'Tramontina',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 145000,
    wholesalePrice: 125000,
    stock: 30,
    lowStockThreshold: 8,
    status: 'active',
    createdAt: '2026-07-01T09:40:00.000Z',
    updatedAt: '2026-07-01T09:40:00.000Z',
  },
  {
    id: 'p10',
    name: 'Набор ножей 6 предметов',
    sku: 'NZH-SET-006',
    barcode: '2000000010010',
    category: 'Ножи',
    brand: 'Tramontina',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 520000,
    wholesalePrice: 460000,
    stock: 8,
    lowStockThreshold: 3,
    status: 'active',
    createdAt: '2026-07-01T09:45:00.000Z',
    updatedAt: '2026-07-01T09:45:00.000Z',
  },
  {
    id: 'p11',
    name: 'Крышка стеклянная 28 см',
    sku: 'KRY-ST-028',
    barcode: '2000000010011',
    category: 'Крышки',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 45000,
    wholesalePrice: 36000,
    stock: 40,
    lowStockThreshold: 10,
    status: 'active',
    createdAt: '2026-07-01T09:50:00.000Z',
    updatedAt: '2026-07-01T09:50:00.000Z',
  },
  {
    id: 'p12',
    name: 'Крышка универсальная 24-28 см',
    sku: 'KRY-UN-028',
    barcode: '2000000010012',
    category: 'Крышки',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 65000,
    wholesalePrice: 54000,
    stock: 25,
    lowStockThreshold: 8,
    status: 'active',
    createdAt: '2026-07-01T09:55:00.000Z',
    updatedAt: '2026-07-01T09:55:00.000Z',
  },
  {
    id: 'p13',
    name: 'Лопатка силиконовая',
    sku: 'PRI-LOP-001',
    barcode: '2000000010013',
    category: 'Принадлежности',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 28000,
    wholesalePrice: 22000,
    stock: 50,
    lowStockThreshold: 15,
    status: 'active',
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'p14',
    name: 'Половник нержавеющий',
    sku: 'PRI-POL-001',
    barcode: '2000000010014',
    category: 'Принадлежности',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 35000,
    wholesalePrice: 28000,
    stock: 35,
    lowStockThreshold: 10,
    status: 'active',
    createdAt: '2026-07-01T10:05:00.000Z',
    updatedAt: '2026-07-01T10:05:00.000Z',
  },
  {
    id: 'p15',
    name: 'Доска разделочная большая',
    sku: 'PRI-DSK-001',
    barcode: '2000000010015',
    category: 'Принадлежности',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 55000,
    wholesalePrice: 44000,
    stock: 22,
    lowStockThreshold: 6,
    status: 'active',
    createdAt: '2026-07-01T10:10:00.000Z',
    updatedAt: '2026-07-01T10:10:00.000Z',
  },
]

function isBrowser() {
  return typeof window !== 'undefined'
}

function normalizeProduct(product: CatalogProduct): CatalogProduct {
  const category = findCategoryReference({ id: product.categoryId, name: product.category })
  const brand = findBrandReference({ id: product.brandId, name: product.brand })
  return {
    ...product,
    name: product.name.trim(),
    sku: product.sku.trim().toUpperCase(),
    barcode: product.barcode.trim(),
    brand: brand?.name ?? (product.brand?.trim() || undefined),
    brandId: brand?.id,
    supplier: product.supplier?.trim() || undefined,
    category: category?.name ?? (product.category?.trim() || '-'),
    categoryId: category?.id,
    unit: product.unit.trim() || 'sht',
    price: Number(product.price) || 0,
    wholesalePrice: Number(product.wholesalePrice) || 0,
    stock: Number(product.stock) || 0,
    lowStockThreshold: Number(product.lowStockThreshold) || 0,
    status: product.status === 'inactive' ? 'inactive' : 'active',
  }
}

function assertFiniteNonNegative(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} не может быть отрицательным.`)
  }
}

export function validateProductDraft(
  draft: ProductDraft,
  products: CatalogProduct[] = readProducts(),
  excludeId?: string,
): ProductDraft {
  const normalized = normalizeProduct({
    ...draft,
    id: excludeId ?? 'validation',
    createdAt: '',
    updatedAt: '',
  })

  if (!normalized.name) throw new Error('Наименование товара обязательно.')
  if (!normalized.sku) throw new Error('Артикул товара обязателен.')
  if (!/^[A-Z0-9][A-Z0-9._/-]{1,63}$/.test(normalized.sku)) {
    throw new Error('Артикул должен содержать от 2 до 64 латинских букв, цифр или символов . _ / -.')
  }
  if (!normalized.barcode) throw new Error('Штрихкод товара обязателен.')
  if (!/^\d{8,14}$/.test(normalized.barcode)) {
    throw new Error('Штрихкод должен содержать от 8 до 14 цифр.')
  }
  if (!normalized.category || normalized.category === '-') {
    throw new Error('Категория товара обязательна.')
  }
  if (!normalized.categoryId) throw new Error('Выбранная категория не найдена или неактивна.')
  if (normalized.brand && !normalized.brandId) {
    throw new Error('Выбранный бренд не найден или неактивен.')
  }
  if (!normalized.unit) throw new Error('Единица измерения обязательна.')
  if (!Number.isFinite(normalized.price) || normalized.price <= 0) {
    throw new Error('Цена продажи должна быть больше нуля.')
  }
  assertFiniteNonNegative(normalized.wholesalePrice, 'Оптовая цена')
  assertFiniteNonNegative(normalized.stock, 'Остаток')
  assertFiniteNonNegative(normalized.lowStockThreshold, 'Порог малого остатка')

  const duplicateSku = products.some(
    (product) => product.id !== excludeId && product.sku.trim().toUpperCase() === normalized.sku,
  )
  if (duplicateSku) throw new Error(`Товар с артикулом ${normalized.sku} уже существует.`)

  const duplicateBarcode = products.some(
    (product) => product.id !== excludeId && product.barcode.trim() === normalized.barcode,
  )
  if (duplicateBarcode) throw new Error(`Товар со штрихкодом ${normalized.barcode} уже существует.`)

  return normalized
}

export function readProducts(): CatalogProduct[] {
  if (!isBrowser()) return seedProducts

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const normalizedSeed = seedProducts.map(normalizeProduct)
    writeProducts(normalizedSeed, false)
    return normalizedSeed
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedProducts.map(normalizeProduct)
    return parsed.map(normalizeProduct)
  } catch {
    return seedProducts.map(normalizeProduct)
  }
}

export function writeProducts(
  products: CatalogProduct[],
  notify = true,
): CatalogProduct[] {
  const normalized = products.map(normalizeProduct)
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    if (notify) {
      window.dispatchEvent(new CustomEvent(PRODUCT_CATALOG_CHANGED))
    }
  }
  return normalized
}

export function updateProduct(id: string, draft: Partial<ProductDraft>): CatalogProduct {
  const products = readProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index < 0) throw new Error('Товар не найден.')
  const now = new Date().toISOString()
  const candidate = normalizeProduct({ ...products[index], ...draft, updatedAt: now })
  const validated = validateProductDraft(candidate, products, id)
  const updated = { ...candidate, ...validated }
  const next = [...products]
  next[index] = updated
  writeProducts(next)
  return updated
}

export function createProduct(draft: ProductDraft): CatalogProduct {
  const now = new Date().toISOString()
  const validated = validateProductDraft(draft)
  const product = normalizeProduct({
    ...validated,
    id: `p-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  })
  writeProducts([product, ...readProducts()])
  return product
}

export function generateSku(name: string) {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'P')
  return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`
}

export function generateBarcode() {
  const body = `200${Math.floor(100000000 + Math.random() * 900000000)}`
  const weightedSum = body
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0)
  const checkDigit = (10 - (weightedSum % 10)) % 10
  return `${body}${checkDigit}`
}

export function parseMoney(value: string) {
  return Number(value.replace(/[^\d]/g, '')) || 0
}

export function formatUZS(value: number) {
  return value.toLocaleString('ru-RU').replace(/,/g, ' ')
}
