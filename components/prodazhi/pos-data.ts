import type { SellerStatus } from '@/lib/erp/erp-store'

export type Seller = {
  id: string
  name: string
  status: SellerStatus
}

export const defaultSeller = 'Исломали Н.'

export const clientGroups = [
  'VIP',
  'Постоянные клиенты',
  'Оптовики',
  'Семейные покупки',
  'Скидка 15%',
  'Скидка 10%',
  'Скидка 5%',
]

export const clientTags = [
  'Instagram',
  'Telegram',
  'Рекомендация',
  'Оптовый клиент',
  'Постоянный клиент',
  'Facebook',
]

export const paymentMethods = [
  { id: 'cash', label: 'Наличные', hotkey: 'F1' },
  { id: 'uzcard', label: 'UzCard', hotkey: 'F2' },
  { id: 'payme', label: 'Payme', hotkey: 'F3' },
  { id: 'click', label: 'Click', hotkey: 'F4' },
  { id: 'humo', label: 'Humo', hotkey: 'F5' },
  { id: 'uzum', label: 'Uzum', hotkey: 'F6' },
  { id: 'transfer', label: 'Перечисление', hotkey: 'F7' },
  { id: 'debt', label: 'В долг', hotkey: 'F8' },
  { id: 'giftcard', label: 'Подарочная карта', hotkey: 'F9' },
] as const

export function formatUZS(value: number) {
  return value.toLocaleString('ru-RU').replace(/,/g, ' ')
}

export function formatChip(value: number) {
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(1)} млн`
  }
  const k = value / 1000
  return `${Number.isInteger(k) ? k : k.toFixed(1)} тысяч`
}

export function formatFixed(value: number) {
  if (value >= 1_000_000) return `${value / 1_000_000}M`
  return `${value / 1000}K`
}

export const statusColor: Record<SellerStatus, string> = {
  online: 'bg-emerald-500',
  busy: 'bg-amber-500',
  away: 'bg-rose-500',
  offline: 'bg-slate-300',
}
