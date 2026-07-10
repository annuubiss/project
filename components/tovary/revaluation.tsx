'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PageHeader,
  TableCard,
  TableHeadRow,
  TableRow,
  StatusBadge,
  Pagination,
  EmptyState,
  Toolbar,
} from './shared'
import {
  ERP_DATA_CHANGED,
  formatDate,
  readRevaluations,
  createRevaluation,
  readWarehouses,
  type ErpRevaluation,
} from '@/lib/erp/erp-store'

const columns = [
  { label: 'ID', className: 'max-w-[100px]' },
  { label: 'Наименование', className: 'flex-[1.3]' },
  { label: 'Магазин' },
  { label: 'Тип', className: 'max-w-[190px]' },
  { label: 'Позиций', className: 'max-w-[90px]' },
  { label: 'Статус', className: 'max-w-[130px]' },
  { label: 'Создал' },
  { label: 'Завершил' },
]

const typeLabels: Record<ErpRevaluation['type'], string> = {
  retail: 'Изменить розничную цену',
  wholesale: 'Изменить оптовую цену',
  cost: 'Изменить цену поставки',
  rate: 'Изменить курс',
}

function NewRevaluationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (id: string) => void
}) {
  const warehouses = readWarehouses()
  const [name, setName] = useState('')
  const [store, setStore] = useState(warehouses[0]?.name ?? 'Магазин')
  const [type, setType] = useState<ErpRevaluation['type']>('retail')
  const [error, setError] = useState('')

  function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Укажите название переоценки')
      return
    }
    const rev = createRevaluation({ name: trimmed, store, type })
    onCreate(rev.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 p-6">
          <h2 className="text-2xl font-black text-foreground">Новая переоценка</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 pb-6">
          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-muted-foreground">
              Название <span className="text-primary">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              placeholder="Переоценка товаров 2026"
              className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-muted-foreground">Магазин</label>
            <div className="relative">
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="h-12 w-full appearance-none rounded-2xl bg-secondary px-4 pr-10 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-muted-foreground">Тип переоценки</label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(typeLabels) as [ErpRevaluation['type'], string][]).map(([val, label]) => (
                <label key={val} className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors',
                  type === val
                    ? 'bg-primary/10 ring-primary/40 text-foreground'
                    : 'bg-secondary ring-transparent hover:ring-border',
                )}>
                  <input
                    type="radio"
                    name="rev-type"
                    value={val}
                    checked={type === val}
                    onChange={() => setType(val)}
                    className="accent-primary"
                  />
                  <span className="text-[15px] font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-semibold text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-secondary py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 rounded-2xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}

export function Revaluation() {
  const router = useRouter()
  const [rows, setRows] = useState<ErpRevaluation[]>([])
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)

  useEffect(() => {
    function load() {
      setRows(readRevaluations())
    }
    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.id, r.name, r.store, typeLabels[r.type]].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  }, [rows, query])

  return (
    <div className="space-y-6">
      <PageHeader title="Переоценка" />

      <Toolbar
        placeholder="ID, наименование, тип"
        query={query}
        onQueryChange={setQuery}
        actionLabel="Новая переоценка"
        actionIcon={<Plus className="size-5" />}
        onAction={() => setModal(true)}
      />

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <EmptyState
            title={rows.length === 0 ? 'Переоценок пока нет' : 'Переоценки не найдены'}
            description={
              rows.length === 0
                ? 'Создайте первую переоценку для изменения цен товаров.'
                : 'Измените поиск, чтобы найти нужную переоценку.'
            }
          />
        </div>
      ) : (
        <TableCard>
          <TableHeadRow columns={columns} />
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <div className="max-w-[100px] flex-1 font-semibold text-muted-foreground">
                {r.id.slice(-6)}
              </div>
              <div className="flex-[1.3]">
                <Link
                  href={`/tovary/pereocenka/${r.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {r.name}
                </Link>
              </div>
              <div className="flex-1 text-muted-foreground">{r.store}</div>
              <div className="max-w-[190px] flex-1 text-foreground">{typeLabels[r.type]}</div>
              <div className="max-w-[90px] flex-1 text-foreground">{r.lines.length}</div>
              <div className="max-w-[130px] flex-1">
                <StatusBadge
                  label={r.status === 'done' ? 'Завершен' : 'Новый'}
                  tone={r.status === 'done' ? 'success' : 'info'}
                />
              </div>
              <div className="flex-1 text-[14px] text-muted-foreground">{r.createdBy}</div>
              <div className="flex-1 text-[14px] text-muted-foreground">
                {r.finishedBy ?? '—'}
              </div>
            </TableRow>
          ))}
        </TableCard>
      )}

      <Pagination pages={1} total={filtered.length} />

      {modal && (
        <NewRevaluationModal
          onClose={() => setModal(false)}
          onCreate={(id) => {
            setModal(false)
            router.push(`/tovary/pereocenka/${id}`)
          }}
        />
      )}
    </div>
  )
}
