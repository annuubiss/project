import { findBrandReference, findCategoryReference } from './categories'
import { getActiveProductUnits } from './product-units'
import { parseMoney, readProducts, validateProductDraft, writeProducts, type CatalogProduct, type ProductDraft } from './product-catalog'

export type ProductImportError = { row: number; field?: string; message: string }
export type ProductImportRow = { row: number; draft: ProductDraft; errors: ProductImportError[] }
export type ProductImportSession = { id: string; fileName: string; createdAt: string; status: 'review' | 'completed'; rows: ProductImportRow[] }
const SESSIONS_KEY = 'erp.productImports.v1'
export const PRODUCT_IMPORTS_CHANGED = 'erp:product-imports-changed'

const aliases: Record<string, string[]> = {
  name: ['наименование', 'название', 'товар', 'name'],
  sku: ['артикул', 'sku'],
  barcode: ['штрихкод', 'баркод', 'barcode'],
  category: ['категория', 'category'],
  brand: ['бренд', 'brand'],
  supplier: ['поставщик', 'supplier'],
  unit: ['единица', 'единица измерения', 'unit'],
  price: ['цена продажи', 'розничная цена', 'price'],
  wholesalePrice: ['оптовая цена', 'wholesale price'],
  stock: ['остаток', 'кол-во', 'количество', 'stock', 'qty'],
  lowStockThreshold: ['минимальный остаток', 'порог остатка', 'low stock'],
}

function key(value: string) { return value.trim().toLocaleLowerCase('ru-RU').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ') }

function parseLine(line: string, delimiter: string) {
  const cells: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1 } else quoted = !quoted
    } else if (char === delimiter && !quoted) { cells.push(value.trim()); value = '' }
    else value += char
  }
  cells.push(value.trim())
  return cells
}

export function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  if (!lines.length) return []
  const candidates = [';', ',', '\t']
  const delimiter = candidates.sort((a, b) => parseLine(lines[0], b).length - parseLine(lines[0], a).length)[0]
  return lines.map((line) => parseLine(line, delimiter))
}

export function prepareProductImport(text: string): ProductImportRow[] {
  const table = parseCsv(text)
  if (table.length < 2) return []
  const headers = table[0].map(key)
  const indexes = Object.fromEntries(Object.entries(aliases).map(([field, names]) => [field, headers.findIndex((header) => names.includes(header))])) as Record<string, number>
  const units = getActiveProductUnits()
  const seenSku = new Set<string>()
  const seenBarcode = new Set<string>()

  return table.slice(1).map((cells, index) => {
    const get = (field: string) => indexes[field] >= 0 ? (cells[indexes[field]] ?? '').trim() : ''
    const category = findCategoryReference({ name: get('category') })
    const brandName = get('brand')
    const brand = brandName ? findBrandReference({ name: brandName }) : null
    const unitInput = key(get('unit') || 'sht')
    const unit = units.find((item) => [key(item.id), key(item.symbol), key(item.label)].includes(unitInput))
    const draft: ProductDraft = {
      name: get('name'), sku: get('sku').toUpperCase(), barcode: get('barcode'),
      category: category?.name ?? get('category'), categoryId: category?.id,
      brand: brand?.name ?? (brandName || undefined), brandId: brand?.id,
      supplier: get('supplier') || undefined, unit: unit?.id ?? unitInput,
      price: parseMoney(get('price')), wholesalePrice: parseMoney(get('wholesalePrice')),
      stock: parseMoney(get('stock')), lowStockThreshold: parseMoney(get('lowStockThreshold')),
      status: 'active',
    }
    const row = index + 2
    const errors: ProductImportError[] = []
    if (!draft.name) errors.push({ row, field: 'name', message: 'Не указано наименование.' })
    if (!draft.sku) errors.push({ row, field: 'sku', message: 'Не указан артикул.' })
    else if (seenSku.has(draft.sku)) errors.push({ row, field: 'sku', message: 'Артикул повторяется в файле.' })
    if (!draft.barcode) errors.push({ row, field: 'barcode', message: 'Не указан штрихкод.' })
    else if (seenBarcode.has(draft.barcode)) errors.push({ row, field: 'barcode', message: 'Штрихкод повторяется в файле.' })
    if (!category) errors.push({ row, field: 'category', message: 'Категория не найдена в справочнике.' })
    if (brandName && !brand) errors.push({ row, field: 'brand', message: 'Бренд не найден в справочнике.' })
    if (!unit) errors.push({ row, field: 'unit', message: 'Единица измерения не найдена.' })
    if (draft.price <= 0) errors.push({ row, field: 'price', message: 'Цена продажи должна быть больше нуля.' })
    if (errors.length === 0) {
      try { validateProductDraft(draft) } catch (error) {
        errors.push({ row, message: error instanceof Error ? error.message : 'Некорректные данные товара.' })
      }
    }
    seenSku.add(draft.sku); seenBarcode.add(draft.barcode)
    return { row, draft, errors }
  })
}

export function readProductImportSessions(): ProductImportSession[] {
  if (typeof window === 'undefined') return []
  try { const value = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
}

function writeSessions(sessions: ProductImportSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  window.dispatchEvent(new Event(PRODUCT_IMPORTS_CHANGED))
}

export function createProductImportSession(fileName: string, text: string) {
  const session: ProductImportSession = { id: `import-${Date.now()}`, fileName, createdAt: new Date().toISOString(), status: 'review', rows: prepareProductImport(text) }
  writeSessions([session, ...readProductImportSessions()])
  return session
}

export function getProductImportSession(id: string) { return readProductImportSessions().find((session) => session.id === id) ?? null }

export function commitProductImport(id: string) {
  const sessions = readProductImportSessions()
  const index = sessions.findIndex((session) => session.id === id)
  if (index < 0) throw new Error('Импорт не найден.')
  const session = sessions[index]
  if (session.status === 'completed') throw new Error('Этот импорт уже выполнен.')
  const errors = session.rows.flatMap((row) => row.errors)
  if (errors.length) throw new Error('Исправьте ошибки перед импортом.')
  const existing = readProducts()
  const pending: CatalogProduct[] = []
  for (const row of session.rows) {
    const validated = validateProductDraft(row.draft, [...existing, ...pending])
    const now = new Date().toISOString()
    pending.push({ ...validated, id: `p-${Date.now()}-${row.row}`, createdAt: now, updatedAt: now })
  }
  writeProducts([...pending, ...existing])
  sessions[index] = { ...session, status: 'completed' }
  writeSessions(sessions)
  return pending
}
