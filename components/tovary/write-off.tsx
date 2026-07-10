'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  Toolbar,
  TableCard,
  TableHeadRow,
  TableRow,
  MoneyCell,
  StatusBadge,
  Pagination,
  EmptyState,
} from './shared'
import {
  ERP_DATA_CHANGED,
  readInventoryMovements,
  type ErpInventoryMovement,
} from '@/lib/erp/erp-store'
import { formatUZS, readProducts } from '@/lib/erp/product-catalog'

type WriteOffRow = {
  id: string
  name: string
  store: string
  qty: number
  usd: string
  uzs: string
  type: string
  user: string
}

const columns = [
  { label: 'ID', className: 'max-w-[110px]' },
  { label: 'Наименование', className: 'flex-[1.3]' },
  { label: 'Магазин' },
  { label: 'Кол-во', className: 'max-w-[90px]' },
  { label: 'Сумма' },
  { label: 'Тип списания', className: 'max-w-[140px]' },
  { label: 'Пользователь' },
  { label: 'Статус', className: 'max-w-[130px]' },
]

function buildWriteOffRows(movements: ErpInventoryMovement[]): WriteOffRow[] {
  const productById = new Map(readProducts().map((product) => [product.id, product]))
  const grouped = new Map<
    string,
    { items: ErpInventoryMovement[]; qty: number; uzs: number; warehouseName: string }
  >()

  for (const movement of movements) {
    if (movement.type !== 'writeoff') continue
    const key = movement.sourceId ?? movement.id
    const product = productById.get(movement.productId)
    const current = grouped.get(key) ?? {
      items: [],
      qty: 0,
      uzs: 0,
      warehouseName: movement.warehouseName,
    }
    current.items.push(movement)
    current.qty += Math.abs(movement.qty)
    current.uzs += Math.abs(movement.qty) * (product?.price ?? 0)
    grouped.set(key, current)
  }

  return Array.from(grouped.entries())
    .map(([id, group]) => ({
      id,
      name: group.items[0]?.reason || `Списание ${id.slice(-6)}`,
      store: group.warehouseName,
      qty: group.qty,
      usd: `${Math.round(group.uzs / 12500)} USD`,
      uzs: `${formatUZS(group.uzs)} UZS`,
      type: group.items[0]?.reason || 'Списание',
      user: 'Исломали Н.',
    }))
    .sort((left, right) => right.id.localeCompare(left.id))
}

function NewWriteOffModal({
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
          <h2 className="text-2xl font-black text-foreground">Новое списание</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-muted-foreground">
              Назовите списание
            </label>
            <input
              defaultValue="Новое списание"
              className="h-14 w-full rounded-2xl bg-background px-4 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-muted-foreground">
              Списание из файла
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
              {['Да', 'Нет'].map((item, index) => (
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

export function WriteOff() {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [rows, setRows] = useState<WriteOffRow[]>([])

  useEffect(() => {
    function load() {
      setRows(buildWriteOffRows(readInventoryMovements()))
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
      <PageHeader title="Списание" />

      <Toolbar
        actionLabel="Новое списание"
        actionIcon={<Plus className="size-5" />}
        onAction={() => setModal(true)}
      />

      {rows.length === 0 ? (
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <EmptyState
            title="Списаний пока нет"
            description="После списания товара операции появятся в этом журнале."
          />
        </div>
      ) : (
        <TableCard>
          <TableHeadRow columns={columns} />
          {rows.map((row) => (
            <TableRow key={row.id}>
              <div className="max-w-[110px] flex-1 font-semibold text-muted-foreground">
                {row.id.slice(-6)}
              </div>
              <div className="flex-[1.3]">
                <Link
                  href={`/tovary/spisanie/${row.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {row.name}
                </Link>
              </div>
              <div className="flex-1 text-muted-foreground">{row.store}</div>
              <div className="max-w-[90px] flex-1 text-foreground">{row.qty}</div>
              <div className="flex-1">
                <MoneyCell usd={row.usd} uzs={row.uzs} />
              </div>
              <div className="max-w-[140px] flex-1 text-foreground">{row.type}</div>
              <div className="flex-1 text-[14px] text-muted-foreground">{row.user}</div>
              <div className="max-w-[130px] flex-1">
                <StatusBadge label="Завершен" tone="success" />
              </div>
            </TableRow>
          ))}
        </TableCard>
      )}

      <Pagination pages={1} />

      {modal ? (
        <NewWriteOffModal
          onClose={() => setModal(false)}
          onContinue={() => router.push(`/tovary/spisanie/${Date.now()}`)}
        />
      ) : null}
    </div>
  )
}
