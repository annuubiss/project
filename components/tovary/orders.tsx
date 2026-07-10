'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CalendarDays,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableCard, TableHeadRow, TableRow, StatusBadge, Pagination } from './shared'
import {
  ERP_DATA_CHANGED,
  readPurchaseOrders,
  readPurchaseReturns,
  readSuppliers,
  type ErpPurchaseOrder,
  type ErpPurchaseReturn,
} from '@/lib/erp/erp-store'
import { FilterPanel, useFilters } from '@/components/ui/filter-panel'

const columns = [
  { label: 'ID', className: 'max-w-[110px]' },
  { label: 'Наименование' },
  { label: 'Поставщик', className: 'max-w-[130px]' },
  { label: 'Магазин' },
  { label: 'Статус', className: 'max-w-[140px]' },
  { label: 'Оплата' },
  { label: 'Кол-во', className: 'max-w-[110px]' },
]

export function Orders() {
  const [mainTab, setMainTab] = useState(0)
  const [statusTab, setStatusTab] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [orders, setOrders] = useState<ErpPurchaseOrder[]>([])
  const [returns, setReturns] = useState<ErpPurchaseReturn[]>([])
  const filters = useFilters({ supplier: '', store: '', status: '' })

  useEffect(() => {
    function load() {
      setOrders(readPurchaseOrders())
      setReturns(readPurchaseReturns())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const supplierOptions = useMemo(
    () => [...new Set(orders.map((o) => o.supplierName))].map((s) => ({ value: s, label: s })),
    [orders],
  )
  const storeOptions = useMemo(
    () => [...new Set(orders.map((o) => o.store))].map((s) => ({ value: s, label: s })),
    [orders],
  )

  const filterFields = useMemo(
    () => [
      { key: 'supplier', label: 'Поставщик', type: 'select' as const, options: supplierOptions },
      { key: 'store', label: 'Магазин', type: 'select' as const, options: storeOptions },
      {
        key: 'status',
        label: 'Статус оплаты',
        type: 'select' as const,
        options: [
          { value: 'unpaid', label: 'Неоплаченные' },
          { value: 'partial', label: 'Частично оплаченные' },
          { value: 'paid', label: 'Оплаченные' },
        ],
      },
    ],
    [supplierOptions, storeOptions],
  )

  const statusTabs = useMemo(
    () => [
      { label: 'Все', count: orders.length },
      { label: 'Неоплаченные', count: orders.filter((item) => item.paidUsd <= 0).length },
      {
        label: 'Частично оплаченные',
        count: orders.filter((item) => item.paidUsd > 0 && item.paidUsd < item.totalUsd).length,
      },
      { label: 'Оплаченные', count: orders.filter((item) => item.paidUsd >= item.totalUsd).length },
    ],
    [orders],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    let source = orders
    if (statusTab === 1) source = source.filter((item) => item.paidUsd <= 0)
    if (statusTab === 2) source = source.filter((item) => item.paidUsd > 0 && item.paidUsd < item.totalUsd)
    if (statusTab === 3) source = source.filter((item) => item.paidUsd >= item.totalUsd)
    if (filters.values.supplier) source = source.filter((item) => item.supplierName === filters.values.supplier)
    if (filters.values.store) source = source.filter((item) => item.store === filters.values.store)
    if (filters.values.status === 'unpaid') source = source.filter((item) => item.paidUsd <= 0)
    if (filters.values.status === 'partial') source = source.filter((item) => item.paidUsd > 0 && item.paidUsd < item.totalUsd)
    if (filters.values.status === 'paid') source = source.filter((item) => item.paidUsd >= item.totalUsd)
    if (!normalized) return source
    return source.filter((item) =>
      [item.id, item.name, item.supplierName, item.store].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [orders, query, statusTab, filters.values])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Заказы</h1>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
        {['Список заказов', 'Возвраты заказов'].map((item, index) => (
          <button
            key={item}
            onClick={() => setMainTab(index)}
            className={cn(
              'rounded-2xl py-3 text-[15px] font-semibold transition-colors',
              mainTab === index
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {statusTabs.map((item, index) => (
          <button
            key={item.label}
            onClick={() => setStatusTab(index)}
            className={cn(
              'rounded-2xl px-4 py-2.5 text-[15px] font-semibold transition-colors',
              statusTab === index
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID, наименование, поставщик"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <FilterPanel
          fields={filterFields}
          values={filters.values}
          onChange={filters.onChange}
          onReset={filters.onReset}
        />
        <button
          onClick={() => setCreateOpen(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Создать
        </button>
      </div>

      {mainTab === 0 ? (
        <>
          <TableCard>
            <TableHeadRow columns={columns} />
            {filtered.map((order) => {
              const ordered = order.lines.reduce((sum, line) => sum + line.orderedQty, 0)
              const received = order.lines.reduce((sum, line) => sum + line.receivedQty, 0)
              return (
                <TableRow key={order.id}>
                  <div className="max-w-[110px] flex-1 font-semibold text-muted-foreground">
                    {order.id.slice(-6)}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/tovary/zakazy/${order.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {order.name}
                    </Link>
                  </div>
                  <div className="max-w-[130px] flex-1 text-foreground">{order.supplierName}</div>
                  <div className="flex-1 text-muted-foreground">{order.store}</div>
                  <div className="max-w-[140px] flex-1">
                    <StatusBadge label={statusLabel(order.status)} tone="info" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-destructive">
                      <span className="size-2 rounded-full bg-destructive" />
                      {order.paidUsd.toFixed(1)} USD
                    </p>
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-muted-foreground">
                      <span className="size-2 rounded-full bg-amber-500" />
                      {(order.totalUsd - order.paidUsd).toFixed(1)} USD
                    </p>
                  </div>
                  <div className="max-w-[110px] flex-1 space-y-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-amber-600">
                      <ArrowUpFromLine className="size-4" />
                      {ordered}
                    </p>
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-primary">
                      <CheckCircle2 className="size-4" />
                      {received}
                    </p>
                  </div>
                </TableRow>
              )
            })}
          </TableCard>

          <Pagination
            pages={1}
            extra={
              <button className="flex items-center gap-2 rounded-xl bg-card px-5 py-2.5 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
                <ArrowDownToLine className="size-4 text-primary" />
                Скачать
              </button>
            }
          />
        </>
      ) : returns.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-sm ring-1 ring-border">
          <h2 className="text-xl font-bold text-foreground">Возвратов пока нет</h2>
          <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
            Здесь появятся возвраты по вашим заказам поставщикам
          </p>
        </div>
      ) : (
        <TableCard>
          <TableHeadRow
            columns={[
              { label: 'ID', className: 'max-w-[110px]' },
              { label: 'Заказ' },
              { label: 'Поставщик', className: 'max-w-[160px]' },
              { label: 'Товары' },
              { label: 'Дата', className: 'max-w-[140px]' },
            ]}
          />
          {returns.map((item) => (
            <TableRow key={item.id}>
              <div className="max-w-[110px] flex-1 font-semibold text-muted-foreground">
                {item.id.slice(-6)}
              </div>
              <div className="flex-1">
                <Link
                  href={`/tovary/zakazy/${item.orderId}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {item.orderName}
                </Link>
              </div>
              <div className="max-w-[160px] flex-1 text-foreground">{item.supplierName}</div>
              <div className="flex-1 text-muted-foreground">
                {item.lines.map((line) => `${line.productName} (${line.qty})`).join(', ')}
              </div>
              <div className="max-w-[140px] flex-1 text-muted-foreground">
                {new Intl.DateTimeFormat('ru-RU').format(new Date(item.createdAt))}
              </div>
            </TableRow>
          ))}
        </TableCard>
      )}

      {createOpen ? <NewOrderModal onClose={() => setCreateOpen(false)} /> : null}
    </div>
  )
}

function statusLabel(status: ErpPurchaseOrder['status']) {
  if (status === 'draft') return 'Черновик'
  if (status === 'ordered') return 'Заказан'
  if (status === 'partial') return 'Частично получен'
  if (status === 'received') return 'Получен'
  if (status === 'paid') return 'Оплачен'
  if (status === 'cancelled') return 'Отменен'
  return 'Заказ'
}

function FieldSelect({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string
  required?: boolean
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[15px] font-medium text-muted-foreground">
        {label} {required ? <span className="text-primary">*</span> : null}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full appearance-none rounded-2xl bg-secondary px-5 pr-11 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const suppliers = readSuppliers()
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name ?? '')
  const [store, setStore] = useState('Магазин / Подвал')
  const [name, setName] = useState('')
  const [fromFile, setFromFile] = useState(false)
  const [date, setDate] = useState('')

  function handleCreate() {
    const params = new URLSearchParams({
      supplier: supplierName,
      store,
      name,
      date,
      fromFile: String(fromFile),
    })
    router.push(`/tovary/zakazy/create?${params.toString()}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 p-6">
          <h2 className="text-2xl font-black text-foreground">Новый заказ</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 sm:grid-cols-2">
          <FieldSelect
            label="Поставщик"
            required
            value={supplierName}
            options={suppliers.map((item) => item.name)}
            onChange={setSupplierName}
          />
          <FieldSelect
            label="Магазин"
            required
            value={store}
            options={['Магазин / Подвал', 'Склад №1', 'Склад №2']}
            onChange={setStore}
          />

          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-muted-foreground">Наименование</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Предзаказ на осень"
              className="h-14 w-full rounded-2xl bg-secondary px-5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-muted-foreground">Заказ из файла</label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
              <button
                onClick={() => setFromFile(true)}
                className={cn(
                  'rounded-xl py-3 text-[15px] font-semibold transition-colors',
                  fromFile
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Да
              </button>
              <button
                onClick={() => setFromFile(false)}
                className={cn(
                  'rounded-xl py-3 text-[15px] font-semibold transition-colors',
                  !fromFile
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Нет
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-muted-foreground">
              Дата получения <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-14 w-full rounded-2xl bg-secondary px-5 pr-12 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40 [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-primary" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 p-6">
          <button
            onClick={onClose}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-secondary text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}
