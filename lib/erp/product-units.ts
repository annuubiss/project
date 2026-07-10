export type ProductUnit = {
  id: string
  label: string
  symbol: string
  status: 'active' | 'inactive'
  system: boolean
}

const STORAGE_KEY = 'erp.productUnits.v1'
export const PRODUCT_UNITS_CHANGED = 'erp:product-units-changed'

export const defaultProductUnits: ProductUnit[] = [
  { id: 'sht', label: 'Штука', symbol: 'шт', status: 'active', system: true },
  { id: 'kg', label: 'Килограмм', symbol: 'кг', status: 'active', system: true },
  { id: 'g', label: 'Грамм', symbol: 'г', status: 'active', system: true },
  { id: 'l', label: 'Литр', symbol: 'л', status: 'active', system: true },
  { id: 'ml', label: 'Миллилитр', symbol: 'мл', status: 'active', system: true },
  { id: 'm', label: 'Метр', symbol: 'м', status: 'active', system: true },
]

function isBrowser() { return typeof window !== 'undefined' }

function normalizeUnit(unit: ProductUnit): ProductUnit {
  return { ...unit, id: unit.id.trim().toLowerCase(), label: unit.label.trim(), symbol: unit.symbol.trim(), status: unit.status === 'inactive' ? 'inactive' : 'active', system: Boolean(unit.system) }
}

export function readProductUnits(): ProductUnit[] {
  if (!isBrowser()) return defaultProductUnits
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProductUnits
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return defaultProductUnits
    return parsed.map((item) => normalizeUnit(item as ProductUnit))
  } catch { return defaultProductUnits }
}

export function writeProductUnits(units: ProductUnit[]) {
  const normalized = units.map(normalizeUnit)
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new Event(PRODUCT_UNITS_CHANGED))
    window.dispatchEvent(new Event('erp:data-changed'))
  }
  return normalized
}

export function getActiveProductUnits() { return readProductUnits().filter((unit) => unit.status === 'active') }

export function createProductUnit(input: { label: string; symbol: string }): ProductUnit {
  const label = input.label.trim()
  const symbol = input.symbol.trim().toLowerCase()
  if (!label || !symbol) throw new Error('Укажите название и сокращение единицы измерения.')
  const units = readProductUnits()
  if (units.some((unit) => unit.id === symbol || unit.symbol.toLowerCase() === symbol)) throw new Error('Такая единица измерения уже существует.')
  const unit = normalizeUnit({ id: symbol, label, symbol, status: 'active', system: false })
  writeProductUnits([...units, unit])
  return unit
}

export function archiveProductUnit(id: string) {
  const units = readProductUnits()
  const unit = units.find((item) => item.id === id)
  if (!unit) throw new Error('Единица измерения не найдена.')
  if (unit.system) throw new Error('Системную единицу измерения нельзя удалить.')
  writeProductUnits(units.map((item) => item.id === id ? { ...item, status: 'inactive' as const } : item))
}
