'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  Plus,
  Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  createClient,
  formatDate,
  getClientSummaryRows,
  type ClientSummaryRow,
} from '@/lib/erp/erp-store'
import { ClientModal } from '@/components/prodazhi/client-modal'

const columns = [
  'ID',
  'ФИО',
  'Телефон',
  'Группы',
  'Теги',
  'Сумма покупок',
  'Последняя покупка',
  'День рождения',
]

const tagStyles: Record<string, string> = {
  Instagram: 'bg-chart-4/10 text-chart-4',
  Traffic: 'bg-chart-5/10 text-chart-5',
  Telegram: 'bg-chart-5/10 text-chart-5',
  Facebook: 'bg-chart-4/10 text-chart-4',
  Рекомендация: 'bg-chart-2/10 text-chart-2',
}

export function AllClients() {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<ClientSummaryRow[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    function load() {
      setClients(getClientSummaryRows())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const filtered = useMemo(
    () =>
      clients.filter(
        (client) =>
          client.name.toLowerCase().includes(query.toLowerCase()) ||
          client.id.includes(query) ||
          client.phone.includes(query) ||
          client.card.includes(query),
      ),
    [clients, query],
  )

  const stats = useMemo(() => {
    const totalSpent = filtered.reduce((sum, client) => sum + client.totalSpent, 0)
    const buyersCount = filtered.filter((client) => client.purchaseCount > 0).length
    const withCards = filtered.filter((client) => client.card).length
    const averageCheck = buyersCount > 0 ? totalSpent / buyersCount : 0
    return { buyersCount, withCards, averageCheck }
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Все клиенты
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStats((prev) => !prev)}
            className="flex items-center gap-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className="size-4" />
            {showStats ? 'Скрыть статистику' : 'Показать статистику'}
          </button>
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border"
          >
            <SlidersHorizontal className="size-5" />
          </span>
        </div>
      </div>

      {showStats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Клиентов" value={filtered.length.toString()} />
          <StatCard label="Покупателей" value={stats.buyersCount.toString()} />
          <StatCard label="С картой" value={stats.withCards.toString()} />
          <StatCard
            label="Средний чек"
            value={`${formatUZS(Math.round(stats.averageCheck))} UZS`}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID, имя, телефон"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setQuery('')}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <ChevronDown className="size-4 text-muted-foreground" />
          <Filter className="size-4 text-primary" />
          Фильтры
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Новый клиент
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-sm ring-1 ring-border">
        <div className="min-w-[900px]">
          <div className="flex items-center gap-4 border-b border-border px-4 py-4 text-[14px] font-semibold text-muted-foreground">
            {columns.map((column) => (
              <div
                key={column}
                className={cn(
                  'flex-1',
                  column === 'ID' && 'max-w-[80px]',
                  column === 'Сумма покупок' && 'text-right',
                )}
              >
                {column}
              </div>
            ))}
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground"
            >
              <Settings2 className="size-4" />
            </span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-4 border-b border-border px-4 py-4 text-[15px] transition-colors last:border-0 hover:bg-secondary/50"
              >
                <div className="max-w-[80px] flex-1 font-medium text-muted-foreground">
                  {client.id.replace(/\D/g, '').slice(-6).padStart(6, '0')}
                </div>
                <div className="flex-1 font-semibold text-primary">{client.name}</div>
                <div className="flex-1">
                  <div className="text-foreground">{client.phone}</div>
                  {client.card ? (
                    <div className="text-[13px] text-muted-foreground">{client.card}</div>
                  ) : null}
                </div>
                <div className="flex-1">
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
                    {client.group}
                  </span>
                </div>
                <div className="flex-1">
                  {client.tags[0] ? (
                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-[13px] font-semibold',
                        tagStyles[client.tags[0]] ?? 'bg-secondary text-foreground',
                      )}
                    >
                      {client.tags[0]}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 text-right font-semibold text-foreground">
                  {formatUZS(client.totalSpent)} UZS
                </div>
                <div className="flex-1 text-foreground">
                  {client.lastPurchaseAt ? formatDate(client.lastPurchaseAt) : '-'}
                </div>
                <div className="flex-1 text-muted-foreground">{client.birthday}</div>
                <div className="size-9 shrink-0" />
              </div>
            ))
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
              <h2 className="text-xl font-bold text-foreground">Клиенты пока не найдены</h2>
              <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
                После продажи с привязкой клиента или создания клиента через POS здесь
                появится живая база покупателей.
              </p>
            </div>
          )}
        </div>
      </div>

      <ClientModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(clientDraft) => {
          createClient(clientDraft)
          setClients(getClientSummaryRows())
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
    </div>
  )
}
