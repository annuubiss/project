'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  TableCard,
  TableHeadRow,
  TableRow,
  StatusBadge,
  Pagination,
  EmptyState,
} from './shared'
import {
  ERP_DATA_CHANGED,
  formatDate,
  readInventoryMovements,
  readWarehouses,
  type ErpInventoryMovement,
} from '@/lib/erp/erp-store'
import { FilterPanel, useFilters } from '@/components/ui/filter-panel'

type TransferRow = {
  id: string
  name: string
  from: string
  to: string
  qty: number
  items: number
  productNames: string
  status: 'Завершен'
  date: string
  time: string
  timestamp: number
}

const columns = [
  { label: 'ID', className: 'max-w-[110px]' },
  { label: 'Наименование', className: 'flex-[1.3]' },
  { label: 'Из склада' },
  { label: 'В локацию' },
  { label: 'Кол-во', className: 'max-w-[90px]' },
  { label: 'Товаров', className: 'max-w-[90px]' },
  { label: 'Статус', className: 'max-w-[130px]' },
  { label: 'Дата', className: 'max-w-[140px]' },
]

function buildTransferRows(movements: ErpInventoryMovement[]): TransferRow[] {
  const grouped = new Map<
    string,
    {
      out?: ErpInventoryMovement
      ins?: ErpInventoryMovement
      qty: number
      productNames: Set<string>
    }
  >()

  for (const movement of movements) {
    if (movement.type !== 'transfer_out' && movement.type !== 'transfer_in') continue
    const key = movement.sourceId ?? movement.id
    const current = grouped.get(key) ?? { qty: 0, productNames: new Set<string>() }
    current.productNames.add(movement.productName)
    if (movement.type === 'transfer_out') {
      current.out = movement
      current.qty += Math.abs(movement.qty)
    } else {
      current.ins = movement
    }
    grouped.set(key, current)
  }

  return Array.from(grouped.entries())
    .map(([id, item]) => {
      const anchor = item.out ?? item.ins
      if (!anchor) return null
      return {
        id,
        name: `Перемещение ${formatDate(anchor.createdAt)}`,
        from: item.out?.warehouseName ?? '-',
        to: item.ins?.warehouseName ?? '-',
        qty: item.qty,
        items: item.productNames.size,
        productNames: Array.from(item.productNames).join(', '),
        status: 'Завершен' as const,
        date: formatDate(anchor.createdAt),
        time: new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(anchor.createdAt)),
        timestamp: new Date(anchor.createdAt).getTime(),
      }
    })
    .filter((row): row is TransferRow => Boolean(row))
    .sort((left, right) => right.timestamp - left.timestamp)
}

const fromFileOptions = ['Да', 'Нет'] as const

function NewTransferModal({
  onClose,
  onContinue,
}: {
  onClose: () => void
  onContinue: () => void
}) {
  const [fromFile, setFromFile] = useState(1)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-card p-8 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-black text-foreground">Новый трансфер</h2>
          <button
            onClick={onClose}
            aria-label="Назад"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-muted-foreground">
              Назовите трансфер
            </label>
            <input
              defaultValue="Новый трансфер"
              className="h-14 w-full rounded-2xl bg-background px-4 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-muted-foreground">
              Трансфер из файла
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
              {fromFileOptions.map((item, index) => (
                <button
                  key={item}
                  onClick={() => setFromFile(index)}
                  className={cn(
                    'rounded-2xl py-3 text-[15px] font-semibold transition-colors',
                    fromFile === index
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-end gap-3 pt-8">
          <button
            onClick={onClose}
            className="rounded-2xl bg-secondary px-8 py-3.5 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Отмена
          </button>
          <button
            onClick={onContinue}
            className="rounded-2xl bg-primary px-10 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  )
}

export function Transfer() {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [rows, setRows] = useState<TransferRow[]>([])
  const [query, setQuery] = useState('')
  const [fromFilter, setFromFilter] = useState('all')
  const [toFilter, setToFilter] = useState('all')
  const warehouses = useMemo(() => readWarehouses(), [])
  const filters = useFilters({ dateFrom: '', dateTo: '' })

  useEffect(() => {
    function load() {
      setRows(buildTransferRows(readInventoryMovements()))
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const filterFields = useMemo(
    () => [
      { key: 'dateFrom', label: 'Дата от', type: 'date-range' as const },
      { key: 'dateTo', label: 'Дата до', type: 'date-range' as const },
    ],
    [],
  )

  const filteredRows = useMemo(() => {
    const value = query.trim().toLowerCase()
    const { dateFrom, dateTo } = filters.values

    return rows.filter((row) => {
      if (fromFilter !== 'all' && row.from !== fromFilter) return false
      if (toFilter !== 'all' && row.to !== toFilter) return false
      if (dateFrom) {
        const from = new Date(dateFrom).getTime()
        if (row.timestamp < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo).getTime() + 86_400_000 // include full day
        if (row.timestamp > to) return false
      }
      if (!value) return true
      return [row.id, row.name, row.from, row.to, row.productNames, row.date].some((item) =>
        item.toLowerCase().includes(value),
      )
    })
  }, [fromFilter, query, rows, toFilter, filters.values])

  return (
    <div className="space-y-6">
      <PageHeader title="Трансфер" />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID, товар, склад"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={fromFilter}
              onChange={(event) => setFromFilter(event.target.value)}
              className="h-14 min-w-[160px] rounded-2xl bg-card px-5 pr-10 text-[15px] font-semibold text-foreground shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Все склады</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={toFilter}
              onChange={(event) => setToFilter(event.target.value)}
              className="h-14 min-w-[170px] rounded-2xl bg-card px-5 pr-10 text-[15px] font-semibold text-foreground shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Все назначения</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <FilterPanel
            fields={filterFields}
            values={filters.values}
            onChange={filters.onChange}
            onReset={filters.onReset}
            triggerLabel="Дата"
          />
          <button
            onClick={() => setModal(true)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Plus className="size-5" />
            Новый трансфер
          </button>
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <EmptyState
            title={rows.length === 0 ? 'Трансферов пока нет' : 'Трансферы не найдены'}
            description={
              rows.length === 0
                ? 'После перемещения товара между складами они появятся в этом журнале.'
                : 'Измените поиск или фильтры, чтобы увидеть другие перемещения.'
            }
          />
        </div>
      ) : (
        <TableCard>
          <TableHeadRow columns={columns} />
          {filteredRows.map((row) => (
            <TableRow key={row.id}>
              <div className="max-w-[110px] flex-1 font-semibold text-muted-foreground">
                {row.id.slice(-6)}
              </div>
              <div className="flex-[1.3]">
                <Link
                  href={`/tovary/transfer/${row.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {row.name}
                </Link>
              </div>
              <div className="flex-1 text-muted-foreground">{row.from}</div>
              <div className="flex-1 text-muted-foreground">{row.to}</div>
              <div className="max-w-[90px] flex-1 text-foreground">{row.qty}</div>
              <div className="max-w-[90px] flex-1 text-foreground">{row.items}</div>
              <div className="max-w-[130px] flex-1">
                <StatusBadge label={row.status} tone="success" />
              </div>
              <div className="max-w-[140px] flex-1 text-[14px] text-muted-foreground">
                {row.date}
                <br />
                {row.time}
              </div>
            </TableRow>
          ))}
        </TableCard>
      )}

      <Pagination pages={1} />

      {modal ? (
        <NewTransferModal
          onClose={() => setModal(false)}
          onContinue={() => router.push(`/tovary/transfer/${Date.now()}`)}
        />
      ) : null}
    </div>
  )
}
