'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, PlusCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  Toolbar,
  TableCard,
  TableHeadRow,
  TableRow,
  StatusBadge,
  Pagination,
  EmptyState,
} from './shared'
import {
  ERP_DATA_CHANGED,
  createInventoryDocument,
  formatDate,
  readInventoryMovements,
  readWarehouses,
  type ErpInventoryMovement,
} from '@/lib/erp/erp-store'

type InventoryRow = {
  id: string
  name: string
  store: string
  qty: string
  added: number
  missing: number
  diffSum: string
  type: 'Полная'
  done: boolean
  date: string
  time: string
}

const columns = [
  { label: 'ID', className: 'max-w-[100px]' },
  { label: 'Наименование', className: 'flex-[1.3]' },
  { label: 'Магазин' },
  { label: 'Кол-во', className: 'max-w-[90px]' },
  { label: 'Разница', className: 'max-w-[110px]' },
  { label: 'Сумма разницы', className: 'max-w-[150px]' },
  { label: 'Тип', className: 'max-w-[120px]' },
  { label: 'Статус', className: 'max-w-[130px]' },
]

function buildInventoryRows(movements: ErpInventoryMovement[]): InventoryRow[] {
  const grouped = new Map<
    string,
    { items: ErpInventoryMovement[]; added: number; missing: number; warehouseName: string }
  >()

  for (const movement of movements) {
    if (movement.type !== 'inventory_adjustment') continue
    const key = movement.sourceId ?? movement.id
    const current = grouped.get(key) ?? {
      items: [],
      added: 0,
      missing: 0,
      warehouseName: movement.warehouseName,
    }
    current.items.push(movement)
    if (movement.qty > 0) {
      current.added += movement.qty
    } else {
      current.missing += Math.abs(movement.qty)
    }
    grouped.set(key, current)
  }

  return Array.from(grouped.entries())
    .map(([id, group]) => {
      const anchor = group.items[0]
      const diffQty = group.added + group.missing
      return {
        id,
        name: anchor.reason || `Инвентаризация ${formatDate(anchor.createdAt)}`,
        store: group.warehouseName,
        qty: String(diffQty),
        added: group.added,
        missing: group.missing,
        diffSum: '-',
        type: 'Полная' as const,
        done: true,
        date: formatDate(anchor.createdAt),
        time: new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(anchor.createdAt)),
      }
    })
    .sort((left, right) => right.id.localeCompare(left.id))
}

const types = ['Полная', 'Частичная'] as const

function NewInventoryModal({
  onClose,
  onStart,
}: {
  onClose: () => void
  onStart: (input: { name: string; warehouseId: string; type: 'full' | 'partial' }) => void
}) {
  const [type, setType] = useState(0)
  const [name, setName] = useState('Новая инвентаризация')
  const warehouses = readWarehouses()
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '')
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-card p-8 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-black text-foreground">Новая инвентаризация</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-5 rotate-45" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-muted-foreground">Наименование</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-14 w-full rounded-2xl bg-background px-4 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-muted-foreground">Зона хранения</label>
            <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="h-14 w-full rounded-2xl bg-background px-4 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40">
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className="text-[15px] font-medium text-muted-foreground">Тип</label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
            {types.map((item, index) => (
              <button
                key={item}
                onClick={() => setType(index)}
                className={cn(
                  'rounded-2xl py-3.5 text-[15px] font-semibold transition-colors',
                  type === index
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item}
              </button>
            ))}
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
            onClick={() => onStart({ name, warehouseId, type: type === 0 ? 'full' : 'partial' })}
            className="rounded-2xl bg-primary px-10 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Начать
          </button>
        </div>
      </div>
    </div>
  )
}

export function Inventory() {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [rows, setRows] = useState<InventoryRow[]>([])

  useEffect(() => {
    function load() {
      setRows(buildInventoryRows(readInventoryMovements()))
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Инвентаризация" />

      <Toolbar
        actionLabel="Новая инвентаризация"
        actionIcon={<Plus className="size-5" />}
        onAction={() => setModal(true)}
      />

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <EmptyState
            title="Инвентаризаций пока нет"
            description="После завершения сверки остатков операции появятся в этом журнале."
          />
        </div>
      ) : (
        <TableCard>
          <TableHeadRow columns={columns} />
          {rows.map((row) => (
            <TableRow key={row.id}>
              <div className="max-w-[100px] flex-1 font-semibold text-muted-foreground">
                {row.id.slice(-6)}
              </div>
              <div className="flex-[1.3]">
                <Link
                  href={`/tovary/inventarizaciya/${row.id}/result`}
                  className="font-semibold text-primary hover:underline"
                >
                  {row.name}
                </Link>
              </div>
              <div className="flex-1 text-muted-foreground">{row.store}</div>
              <div className="max-w-[90px] flex-1 text-foreground">{row.qty}</div>
              <div className="max-w-[110px] flex-1 space-y-1 text-[13px] font-semibold">
                <p className="flex items-center gap-1.5 text-primary">
                  <PlusCircle className="size-3.5" />
                  {row.added}
                </p>
                <p className="flex items-center gap-1.5 text-destructive">
                  <MinusCircle className="size-3.5" />
                  {row.missing}
                </p>
              </div>
              <div className="max-w-[150px] flex-1 font-semibold text-muted-foreground">
                {row.diffSum}
              </div>
              <div className="max-w-[120px] flex-1 text-foreground">{row.type}</div>
              <div className="max-w-[130px] flex-1">
                {row.done ? (
                  <StatusBadge label="Завершен" tone="success" />
                ) : (
                  <StatusBadge label="В работе" tone="info" />
                )}
              </div>
            </TableRow>
          ))}
        </TableCard>
      )}

      <Pagination pages={1} />

      {modal ? (
        <NewInventoryModal
          onClose={() => setModal(false)}
          onStart={(input) => {
            const document = createInventoryDocument(input)
            setModal(false)
            router.push(`/tovary/inventarizaciya/${document.id}`)
          }}
        />
      ) : null}
    </div>
  )
}
