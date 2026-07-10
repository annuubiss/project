/**
 * Product categories and brands management.
 */

const CATEGORIES_KEY = 'erp.categories.v1'
const BRANDS_KEY = 'erp.brands.v1'
export const PRODUCT_REFERENCES_CHANGED = 'erp:product-references-changed'

export type ProductCategory = {
  id: string
  name: string
  parentId: string | null
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export type ProductBrand = {
  id: string
  name: string
  country?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export type CategoryTreeItem = ProductCategory & {
  children: ProductCategory[]
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function emitChange() {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(PRODUCT_REFERENCES_CHANGED))
  window.dispatchEvent(new CustomEvent('erp:data-changed'))
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
  emitChange()
}

function seedJson<T>(key: string, value: T): void {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const defaultCategories: Array<Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Казаны', parentId: null, status: 'active' },
  { name: 'Сковороды', parentId: null, status: 'active' },
  { name: 'Кастрюли', parentId: null, status: 'active' },
  { name: 'Чайники', parentId: null, status: 'active' },
  { name: 'Ножи', parentId: null, status: 'active' },
  { name: 'Крышки', parentId: null, status: 'active' },
  { name: 'Принадлежности', parentId: null, status: 'active' },
  { name: 'Другие товары', parentId: null, status: 'active' },
]

const defaultBrands: Array<Omit<ProductBrand, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'Tefal', country: 'Франция', status: 'active' },
  { name: 'Rondell', country: 'Германия', status: 'active' },
  { name: 'Tramontina', country: 'Бразилия', status: 'active' },
  { name: 'Philips', country: 'Нидерланды', status: 'active' },
  { name: 'Узбекистан', country: 'Узбекистан', status: 'active' },
]

function normalizeCategory(category: ProductCategory): ProductCategory {
  return {
    ...category,
    name: category.name.trim(),
    parentId: category.parentId ?? null,
    status: category.status === 'inactive' ? 'inactive' : 'active',
  }
}

function normalizeBrand(brand: ProductBrand): ProductBrand {
  return {
    ...brand,
    name: brand.name.trim(),
    country: brand.country?.trim() || undefined,
    status: brand.status === 'inactive' ? 'inactive' : 'active',
  }
}

export function readCategories(): ProductCategory[] {
  const stored = readJson<ProductCategory[]>(CATEGORIES_KEY, [])
  if (stored.length > 0) {
    return stored
      .map(normalizeCategory)
      .sort((left, right) => left.name.localeCompare(right.name, 'ru-RU'))
  }

  const now = new Date().toISOString()
  const seeded = defaultCategories.map((item) =>
    normalizeCategory({
      id: makeId('cat'),
      ...item,
      createdAt: now,
      updatedAt: now,
    }),
  )
  // Initializing reference data is a read concern. Emitting a global change
  // event here can update subscribers while a component is still rendering.
  seedJson(CATEGORIES_KEY, seeded)
  return seeded
}

export function writeCategories(categories: ProductCategory[]): void {
  writeJson(CATEGORIES_KEY, categories.map(normalizeCategory))
}

export function getCategoryTree(): CategoryTreeItem[] {
  const categories = readCategories().filter((item) => item.status === 'active')
  const parents = categories.filter((item) => !item.parentId)
  return parents.map((parent) => ({
    ...parent,
    children: categories.filter((item) => item.parentId === parent.id),
  }))
}

export function getActiveCategoryOptions(): ProductCategory[] {
  return readCategories().filter((item) => item.status === 'active')
}

export function findCategoryReference(input: { id?: string; name?: string }) {
  const id = input.id?.trim()
  const name = input.name?.trim().toLocaleLowerCase('ru-RU')
  return readCategories().find(
    (item) =>
      item.status === 'active' &&
      ((id && item.id === id) || (name && item.name.toLocaleLowerCase('ru-RU') === name)),
  ) ?? null
}

export function createCategory(input: {
  name: string
  parentId?: string | null
}): ProductCategory {
  const name = input.name.trim()
  if (!name) throw new Error('Название категории обязательно.')

  const categories = readCategories()
  const duplicate = categories.find(
    (item) =>
      item.status === 'active' &&
      item.parentId === (input.parentId ?? null) &&
      item.name.toLowerCase() === name.toLowerCase(),
  )
  if (duplicate) throw new Error('Категория с таким названием уже существует.')

  const now = new Date().toISOString()
  const category = normalizeCategory({
    id: makeId('cat'),
    name,
    parentId: input.parentId ?? null,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })

  writeCategories([...categories, category])
  return category
}

export function ensureCategoryExists(name: string): ProductCategory | null {
  const normalized = name.trim()
  if (!normalized) return null

  const existing = readCategories().find(
    (item) => item.status === 'active' && item.name.toLowerCase() === normalized.toLowerCase(),
  )
  if (existing) return existing

  return createCategory({ name: normalized })
}

export function updateCategory(input: {
  id: string
  name: string
  parentId?: string | null
  status?: 'active' | 'inactive'
}): ProductCategory {
  const name = input.name.trim()
  if (!name) throw new Error('Название категории обязательно.')

  const categories = readCategories()
  const existing = categories.find((item) => item.id === input.id)
  if (!existing) throw new Error('Категория не найдена.')

  const duplicate = categories.find(
    (item) =>
      item.id !== input.id &&
      item.status === 'active' &&
      item.parentId === (input.parentId ?? existing.parentId) &&
      item.name.toLowerCase() === name.toLowerCase(),
  )
  if (duplicate) throw new Error('Категория с таким названием уже существует.')

  const updated = normalizeCategory({
    ...existing,
    name,
    parentId: input.parentId ?? existing.parentId,
    status: input.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  })

  writeCategories(categories.map((item) => (item.id === input.id ? updated : item)))
  return updated
}

export function deleteCategory(id: string): void {
  const now = new Date().toISOString()
  writeCategories(
    readCategories().map((item) =>
      item.id === id || item.parentId === id
        ? { ...item, status: 'inactive' as const, updatedAt: now }
        : item,
    ),
  )
}

export function readBrands(): ProductBrand[] {
  const stored = readJson<ProductBrand[]>(BRANDS_KEY, [])
  if (stored.length > 0) {
    return stored
      .map(normalizeBrand)
      .sort((left, right) => left.name.localeCompare(right.name, 'ru-RU'))
  }

  const now = new Date().toISOString()
  const seeded = defaultBrands.map((item) =>
    normalizeBrand({
      id: makeId('brand'),
      ...item,
      createdAt: now,
      updatedAt: now,
    }),
  )
  seedJson(BRANDS_KEY, seeded)
  return seeded
}

export function writeBrands(brands: ProductBrand[]): void {
  writeJson(BRANDS_KEY, brands.map(normalizeBrand))
}

export function getActiveBrandOptions(): ProductBrand[] {
  return readBrands().filter((item) => item.status === 'active')
}

export function findBrandReference(input: { id?: string; name?: string }) {
  const id = input.id?.trim()
  const name = input.name?.trim().toLocaleLowerCase('ru-RU')
  return readBrands().find(
    (item) =>
      item.status === 'active' &&
      ((id && item.id === id) || (name && item.name.toLocaleLowerCase('ru-RU') === name)),
  ) ?? null
}

export function createBrand(input: {
  name: string
  country?: string
}): ProductBrand {
  const name = input.name.trim()
  if (!name) throw new Error('Название бренда обязательно.')

  const brands = readBrands()
  const duplicate = brands.find(
    (item) => item.status === 'active' && item.name.toLowerCase() === name.toLowerCase(),
  )
  if (duplicate) throw new Error('Бренд с таким названием уже существует.')

  const now = new Date().toISOString()
  const brand = normalizeBrand({
    id: makeId('brand'),
    name,
    country: input.country?.trim(),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  })

  writeBrands([...brands, brand])
  return brand
}

export function ensureBrandExists(name: string): ProductBrand | null {
  const normalized = name.trim()
  if (!normalized) return null

  const existing = readBrands().find(
    (item) => item.status === 'active' && item.name.toLowerCase() === normalized.toLowerCase(),
  )
  if (existing) return existing

  return createBrand({ name: normalized })
}

export function updateBrand(input: {
  id: string
  name: string
  country?: string
  status?: 'active' | 'inactive'
}): ProductBrand {
  const name = input.name.trim()
  if (!name) throw new Error('Название бренда обязательно.')

  const brands = readBrands()
  const existing = brands.find((item) => item.id === input.id)
  if (!existing) throw new Error('Бренд не найден.')

  const duplicate = brands.find(
    (item) =>
      item.id !== input.id &&
      item.status === 'active' &&
      item.name.toLowerCase() === name.toLowerCase(),
  )
  if (duplicate) throw new Error('Бренд с таким названием уже существует.')

  const updated = normalizeBrand({
    ...existing,
    name,
    country: input.country?.trim() ?? existing.country,
    status: input.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  })

  writeBrands(brands.map((item) => (item.id === input.id ? updated : item)))
  return updated
}

export function deleteBrand(id: string): void {
  const now = new Date().toISOString()
  writeBrands(
    readBrands().map((item) =>
      item.id === id ? { ...item, status: 'inactive' as const, updatedAt: now } : item,
    ),
  )
}
