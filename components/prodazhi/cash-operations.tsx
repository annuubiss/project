'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Plus,
  Wallet,
  X,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  createFinanceTransfer,
  createManualFinanceTransaction,
  formatDateTime,
  getActivePosPaymentMethods,
  getFinanceCategoryOptions,
  readCashRegisters,
  readFinanceTransactions,
  type ErpFinanceTransaction,
} from '@/lib/erp/erp-store'

type OpType = 'income' | 'expense' | 'collection'

type OperationRow = {
  id: string
  type: OpType
  amount: number
  method: string
  category: string
  reason: string
  cashier: string
  datetime: string
}

const opMeta: Record<
  OpType,
  { label: string; verb: string; tone: 'pos' | 'neg'; icon: typeof ArrowDownLeft }
> = {
  income: { label: 'Доход', verb: 'Доход', tone: 'pos', icon: ArrowDownLeft },
  expense: { label: 'Расход', verb: 'Расход', tone: 'neg', icon: ArrowUpRight },
  collection: {
    label: 'Инкассация',
    verb: 'Инкассация',
    tone: 'neg',
    icon: Banknote,
  },
}

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' UZS'
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  )
}

function OperationModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (op: {
    type: OpType
    amount: number
    method: string
    category: string
    reason: string
    fromAccount: string
    toAccount: string
  }) => void
}) {
  const methods = getActivePosPaymentMethods()
  const registers = readCashRegisters().filter((item) => item.status === 'active')
  const incomeCategories = getFinanceCategoryOptions('income').map((item) => item.name)
  const expenseCategories = getFinanceCategoryOptions('expense').map((item) => item.name)

  const [type, setType] = useState<OpType>('income')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState(methods[0]?.label ?? 'Наличные')
  const [category, setCategory] = useState(incomeCategories[0] ?? 'Доход')
  const [reason, setReason] = useState('')
  const [fromAccount, setFromAccount] = useState(registers[0]?.name ?? 'Касса Магазин')
  const [toAccount, setToAccount] = useState(registers[1]?.name ?? 'Безналичный счет Магазин')

  const numeric = Number(amount.replace(/\D/g, ''))
  const valid = numeric > 0
  const tone = opMeta[type].tone

  function pickType(nextType: OpType) {
    setType(nextType)
    if (nextType === 'income') setCategory(incomeCategories[0] ?? 'Доход')
    if (nextType === 'expense') setCategory(expenseCategories[0] ?? 'Расход')
    if (nextType === 'collection') setCategory('Инкассация в банк')
  }

  const categoryOptions =
    type === 'income'
      ? incomeCategories
      : type === 'expense'
        ? expenseCategories
        : ['Инкассация в банк', 'Перевод в главную кассу', 'Выемка наличных']

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-card p-7 shadow-2xl ring-1 ring-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Новая операция</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-secondary p-1.5">
          {(Object.keys(opMeta) as OpType[]).map((item) => {
            const Icon = opMeta[item].icon
            const active = type === item
            return (
              <button
                key={item}
                onClick={() => pickType(item)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-colors',
                  active
                    ? opMeta[item].tone === 'pos'
                      ? 'bg-card text-primary shadow-sm'
                      : 'bg-card text-destructive shadow-sm'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
                {opMeta[item].label}
              </button>
            )
          })}
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-foreground">Сумма</label>
            <div className="relative">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="numeric"
                placeholder="Введите сумму"
                className="h-14 w-full rounded-2xl bg-secondary px-5 pr-16 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:bg-card focus:ring-2 focus:ring-primary/40"
              />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-muted-foreground">
                UZS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField label="Тип оплаты" value={method} onChange={setMethod} options={methods.map((item) => item.label)} />
            <SelectField label="Категория" value={category} onChange={setCategory} options={categoryOptions} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SelectField label="Счет списания" value={fromAccount} onChange={setFromAccount} options={registers.map((item) => item.name)} />
            <SelectField label="Счет назначения" value={toAccount} onChange={setToAccount} options={registers.map((item) => item.name)} />
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-foreground">Комментарий</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="Укажите причину операции"
              className="w-full resize-none rounded-2xl bg-secondary px-5 py-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:bg-card focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl bg-secondary px-7 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Отмена
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onCreate({
                type,
                amount: numeric,
                method,
                category,
                reason: reason.trim() || category,
                fromAccount,
                toAccount,
              })
            }
            className={cn(
              'rounded-2xl px-8 py-3.5 text-[15px] font-bold text-primary-foreground shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              tone === 'pos'
                ? 'bg-primary shadow-primary/30 hover:bg-primary/90'
                : 'bg-destructive shadow-destructive/30 hover:bg-destructive/90',
            )}
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-[14px] font-semibold text-foreground">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full appearance-none rounded-2xl bg-secondary px-5 pr-10 text-[15px] font-medium text-foreground outline-none ring-1 ring-transparent transition-shadow focus:bg-card focus:ring-2 focus:ring-primary/40"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}

export function CashOperations() {
  const [expanded, setExpanded] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | OpType>('all')
  const [transactions, setTransactions] = useState<ErpFinanceTransaction[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    function load() {
      setTransactions(readFinanceTransactions())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const ops = useMemo(
    () =>
      transactions
        .filter((transaction) => {
          if (
            transaction.sourceType === 'income' ||
            transaction.sourceType === 'expense' ||
            transaction.sourceType === 'supplier_payment'
          ) {
            return true
          }
          return transaction.sourceType === 'transfer' && transaction.operation.startsWith('Инкассация')
        })
        .map(mapOperationRow),
    [transactions],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ops.filter((item) => {
      const matchesQuery =
        !q ||
        item.id.includes(q) ||
        item.reason.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.cashier.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      return matchesQuery && matchesType
    })
  }, [ops, query, typeFilter])

  const totalIn = ops.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const totalOut = ops.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const totalCollection = ops.filter((item) => item.type === 'collection').reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIn - totalOut - totalCollection

  function handleCreate(op: {
    type: OpType
    amount: number
    method: string
    category: string
    reason: string
    fromAccount: string
    toAccount: string
  }) {
    if (op.type === 'income' || op.type === 'expense') {
      createManualFinanceTransaction({
        type: op.type,
        amount: op.amount,
        account: op.fromAccount,
        method: op.method,
        category: op.category,
        reason: op.reason,
      })
    } else {
      createFinanceTransfer({
        fromAccount: op.fromAccount,
        toAccount: op.toAccount,
        amount: op.amount,
        method: op.method,
        operationLabel: op.reason ? `Инкассация: ${op.reason}` : 'Инкассация',
      })
    }
    setModalOpen(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Кассовые операции
              </h1>
              <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-[15px] font-bold text-muted-foreground">
                {ops.length}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border">
              <Calendar className="size-5 text-primary" />
              <span className="text-[15px] font-semibold text-foreground">
                {new Intl.DateTimeFormat('ru-RU').format(new Date())}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ID, категория, причина, кассир"
                className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => {
                setQuery('')
                setTypeFilter('all')
              }}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <ChevronDown className="size-4 text-muted-foreground" />
              <Filter className="size-4 text-primary" />
              Фильтр
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Все' },
                { id: 'income', label: 'Доходы' },
                { id: 'expense', label: 'Расходы' },
                { id: 'collection', label: 'Инкассация' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setTypeFilter(item.id)}
                className={cn(
                  'rounded-2xl px-5 py-2.5 text-[14px] font-semibold transition-colors',
                  typeFilter === item.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'bg-card text-foreground ring-1 ring-border hover:bg-secondary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="rounded-2xl bg-card px-4 py-2 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border">
              Сегодня
            </span>
            <button
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? 'Свернуть' : 'Развернуть'}
              className="flex size-9 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground"
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            <div className="h-px flex-1 bg-border" />
          </div>

          {expanded ? (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-3xl bg-card p-10 text-center shadow-sm ring-1 ring-border">
                  <p className="text-[15px] font-semibold text-foreground">Операции не найдены</p>
                </div>
              ) : (
                filtered.map((item) => {
                  const meta = opMeta[item.type]
                  const Icon = meta.icon
                  const pos = meta.tone === 'pos'
                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-2xl',
                            pos ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive',
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-bold text-foreground">
                            {meta.verb} #{item.id}
                          </p>
                          <p className="truncate text-[14px] text-muted-foreground">
                            {item.category} · {item.reason}
                          </p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className={cn('text-[15px] font-bold', pos ? 'text-primary' : 'text-destructive')}>
                            {pos ? '+' : '-'} {fmt(item.amount)}
                          </p>
                          <p className="text-[14px] text-muted-foreground">{item.datetime}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[13px] font-semibold text-muted-foreground">
                          <User className="size-3.5" />
                          {item.cashier}
                        </span>
                        <span className="rounded-full bg-secondary px-3 py-1.5 text-[13px] font-semibold text-muted-foreground">
                          {item.method}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <button
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Plus className="size-5" />
            Новая операция
          </button>

          <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] text-muted-foreground">Операции</p>
                <p className="text-2xl font-black text-foreground">{ops.length} шт</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5">
              <ReportRow label="Доходы" value={`${ops.filter((item) => item.type === 'income').length} шт`} />
              <ReportRow label="Расходы" value={`${ops.filter((item) => item.type === 'expense').length} шт`} />
              <ReportRow label="Сумма доходов" value={fmt(totalIn)} />
              <ReportRow label="Сумма расходов" value={fmt(totalOut)} />
              <ReportRow label="Инкассаций" value={`${ops.filter((item) => item.type === 'collection').length} шт`} />
              <ReportRow label="Сумма инкассаций" value={fmt(totalCollection)} />
            </div>
          </div>

          <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] text-muted-foreground">Баланс кассы</p>
                <p className={cn('text-2xl font-black', balance >= 0 ? 'text-primary' : 'text-destructive')}>
                  {(balance >= 0 ? '+' : '-') + ' ' + fmt(Math.abs(balance))}
                </p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
            </div>
          </div>
        </aside>
      </div>

      {modalOpen ? <OperationModal onClose={() => setModalOpen(false)} onCreate={handleCreate} /> : null}
    </>
  )
}

function mapOperationRow(transaction: ErpFinanceTransaction): OperationRow {
  const type: OpType =
    transaction.sourceType === 'income'
      ? 'income'
      : transaction.sourceType === 'expense' ||
          transaction.sourceType === 'supplier_payment'
        ? 'expense'
        : 'collection'

  const operationParts = transaction.operation.split(':')
  const details = operationParts.slice(1).join(':').trim()
  const [categoryPart, reasonPart] = details
    ? details.split('—').map((item) => item.trim())
    : []
  const category = categoryPart || transaction.operation
  const reason = reasonPart || details || transaction.operation

  return {
    id: transaction.id.replace(/\D/g, '').slice(-6).padStart(4, '0'),
    type,
    amount: Math.abs(transaction.amount),
    method: transaction.method,
    category,
    reason,
    cashier: 'Исломали Н.',
    datetime: formatDateTime(transaction.createdAt),
  }
}
