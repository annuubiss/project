'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, ChevronDown } from 'lucide-react'
import {
  TableCard,
  TableHeadRow,
  TableRow,
  Pagination,
} from './shared'
import {
  ERP_DATA_CHANGED,
  createSupplier,
  getSupplierSummaryRows,
  type SupplierSummaryRow,
} from '@/lib/erp/erp-store'

const columns = [
  { label: 'ID', className: 'max-w-[110px]' },
  { label: 'Наименование' },
  { label: 'Сумма долга' },
  { label: 'Сумма заказов' },
  { label: 'Сумма оплат' },
  { label: 'Кол-во товаров', className: 'max-w-[150px]' },
  { label: 'Телефон' },
]

export function Suppliers() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<SupplierSummaryRow[]>([])

  useEffect(() => {
    function load() {
      setRows(getSupplierSummaryRows())
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
    const normalized = query.trim().toLowerCase()
    if (!normalized) return rows
    return rows.filter((row) =>
      [row.id, row.name, row.phone].some((value) => value.toLowerCase().includes(normalized)),
    )
  }, [query, rows])

  function handleCreate() {
    createSupplier({
      name: `Поставщик ${rows.length + 1}`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Поставщики
        </h1>
        <button className="flex items-center gap-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronDown className="size-4" />
          Показать статистику
        </button>
      </div>

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
        <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
          <Plus className="size-5 text-primary" />
          Добавить оплату
        </button>
        <button
          onClick={handleCreate}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Новый поставщик
        </button>
      </div>

      <TableCard>
        <TableHeadRow columns={columns} />
        {filtered.map((row) => (
          <TableRow key={row.id}>
            <div className="max-w-[110px] flex-1 font-semibold text-muted-foreground">
              {row.id.slice(-6)}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-primary">{row.name}</span>
            </div>
            <div className="flex-1 font-semibold text-foreground">{row.debtUsd.toFixed(1)} USD</div>
            <div className="flex-1 text-foreground">{row.ordersUsd.toFixed(1)} USD</div>
            <div className="flex-1 text-foreground">{row.paymentsUsd.toFixed(1)} USD</div>
            <div className="max-w-[150px] flex-1 text-foreground">{row.items}</div>
            <div className="flex-1 text-muted-foreground">{row.phone}</div>
          </TableRow>
        ))}
      </TableCard>

      <Pagination pages={1} />
    </div>
  )
}
