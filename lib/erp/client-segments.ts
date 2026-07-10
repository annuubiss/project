import {
  ERP_DATA_CHANGED,
  getClientSummaryRows,
  readClients,
  writeClients,
} from './erp-store'

export type GroupStatus = 'active' | 'inactive'

export type ClientGroupRecord = {
  id: string
  name: string
  description: string
  status: GroupStatus
  createdAt: string
  updatedAt: string
}

export const CLIENT_GROUPS_STORAGE_KEY = 'erp.clientGroups.v1'

export const defaultClientGroups = [
  'VIP',
  'Постоянные клиенты',
  'Оптовики',
  'Семейные покупки',
  'Скидка 15%',
  'Скидка 10%',
  'Скидка 5%',
]

export const defaultClientTags = [
  'Instagram',
  'Telegram',
  'Рекомендация',
  'Оптовый клиент',
  'Постоянный клиент',
  'Facebook',
]

function isBrowser() {
  return typeof window !== 'undefined'
}

export function readClientGroups(): ClientGroupRecord[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(CLIENT_GROUPS_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ClientGroupRecord[]
  } catch {}
  return []
}

export function writeClientGroups(groups: ClientGroupRecord[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(CLIENT_GROUPS_STORAGE_KEY, JSON.stringify(groups))
  window.dispatchEvent(new CustomEvent(ERP_DATA_CHANGED))
}

export function seedClientGroupsFromClients(): ClientGroupRecord[] {
  const now = new Date().toISOString()
  const names = Array.from(
    new Set(
      getClientSummaryRows()
        .map((client) => client.group)
        .filter((group) => group && group !== '-'),
    ),
  )

  const source = names.length > 0 ? names : defaultClientGroups

  return source.map((name, index) => ({
    id: `group-${Date.now()}-${index}`,
    name,
    description: '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }))
}

export function ensureClientGroups(): ClientGroupRecord[] {
  const stored = readClientGroups()
  if (stored.length > 0) return stored

  const seeded = seedClientGroupsFromClients()
  if (seeded.length > 0) {
    writeClientGroups(seeded)
  }
  return seeded
}

export function renameClientGroup(previousName: string, nextName: string) {
  const clients = readClients()
  const updated = clients.map((client) =>
    client.group === previousName
      ? { ...client, group: nextName, updatedAt: new Date().toISOString() }
      : client,
  )
  writeClients(updated)
}

export function getAvailableClientGroups() {
  const groups = ensureClientGroups()
    .filter((group) => group.status === 'active')
    .map((group) => group.name)

  return Array.from(new Set([...groups, ...defaultClientGroups]))
}

export function getAvailableClientTags() {
  const tags = readClients().flatMap((client) => client.tags)
  return Array.from(new Set([...tags, ...defaultClientTags])).filter(Boolean)
}
