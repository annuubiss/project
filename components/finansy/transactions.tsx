'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  DollarSign,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  createFinanceConversion,
  createFinanceShiftClosure,
  createFinanceTransfer,
  createManualFinanceTransaction,
  formatDate,
  formatTime,
  getFinanceAccountsSummary,
  getFinanceCategoryOptions,
  readFinanceConversions,
  readFinanceShifts,
  readFinanceTransactions,
  readFinanceTransfers,
  type ErpFinanceConversion,
  type ErpFinanceShift,
  type ErpFinanceTransaction,
  type ErpFinanceTransfer,
} from '@/lib/erp/erp-store'
import { exportCsv, exportDateStamp, exportExcel, exportJson } from '@/lib/erp/export'
import { queryItems } from '@/lib/erp/storage'
import { DataPagination } from '@/components/ui/data-pagination'
import { ExportActions } from '@/components/ui/export-actions'

type TabId = 'transactions' | 'shifts' | 'transfers' | 'conversions'
type AddType = 'income' | 'expense' | 'transfer' | 'conversion'
type PaymentMethod = 'cash' | 'cashless'

type Txn = {
  id: string
  date: string
  time: string
  opDate: string
  operation: string
  kind: 'ДДС' | 'Сквозной' | 'ПиУ'
  amount: number
  currency: string
  account: string
  method: string
  positive: boolean
}

const tabs: { id: TabId; label: string; badge?: boolean }[] = [
  { id: 'transactions', label: 'Доходы / Расходы' },
  { id: 'shifts', label: 'Закрытие смен', badge: true },
  { id: 'transfers', label: 'Перемещения' },
  { id: 'conversions', label: 'Конвертации' },
]

const addOptions: { id: AddType; label: string; icon: typeof ArrowDownLeft; color: string }[] = [
  { id: 'income', label: 'Доход', icon: ArrowDownLeft, color: 'text-chart-2' },
  { id: 'expense', label: 'Расход', icon: ArrowUpRight, color: 'text-chart-4' },
  { id: 'transfer', label: 'Перемещение', icon: ArrowLeftRight, color: 'text-primary' },
  { id: 'conversion', label: 'Конвертация', icon: DollarSign, color: 'text-chart-5' },
]

function money(amount: number, currency: string) {
  const sign = amount > 0 ? '+' : ''
  return `${sign}${amount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ${currency}`
}

function plain(amount: number) {
  return amount.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
}

function formatUzsCell(value: unknown) {
  return `${plain(Number(value) || 0)} UZS`
}

const kindBadge: Record<Txn['kind'], string> = {
  ДДС: 'bg-primary/10 text-primary',
  Сквозной: 'bg-chart-5/15 text-chart-5',
  ПиУ: 'bg-chart-3/15 text-chart-3',
}

function StatCard({
  icon: Icon,
  title,
  cash,
  cashless,
}: {
  icon: typeof ArrowDownLeft
  title: string
  cash: string
  cashless: string
}) {
  return (
    <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h3 className="text-[17px] font-black leading-tight text-foreground">{title}</h3>
      </div>
      <div className="mt-4 space-y-1 border-t border-border pt-4 text-[14px]">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Нал.</span>
          <span className="font-semibold tabular-nums text-foreground">{cash}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Безнал.</span>
          <span className="font-semibold tabular-nums text-foreground">{cashless}</span>
        </p>
      </div>
    </div>
  )
}

function SidePanel({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-full max-w-[560px] flex-col bg-background shadow-2xl">
        <div className="flex items-center gap-4 border-b border-border px-7 py-5">
          <button
            onClick={onClose}
            aria-label="Назад"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-black text-foreground">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  )
}

function NewTransactionPanel({ type, onClose }: { type: AddType; onClose: () => void }) {
  const accountOptions = useMemo(() => {
    const rows = getFinanceAccountsSummary().rows
    if (rows.length > 0) {
      return rows.map((row) => `Касса ${row.name}`)
    }
    return ['Касса Магазин посуды', 'Безналичный счет Магазин посуды']
  }, [])

  const categoryOptions = useMemo(() => {
    if (type !== 'income' && type !== 'expense') return []
    return getFinanceCategoryOptions(type).map((category) => category.name)
  }, [type])

  const [amount, setAmount] = useState('')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [account, setAccount] = useState(accountOptions[0] ?? 'Касса Магазин посуды')
  const [targetAccount, setTargetAccount] = useState(
    accountOptions[1] ?? accountOptions[0] ?? 'Безналичный счет Магазин посуды',
  )
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [category, setCategory] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const titles: Record<AddType, string> = {
    income: 'Новый доход',
    expense: 'Новый расход',
    transfer: 'Новое перемещение',
    conversion: 'Новая конвертация',
  }

  function handleSave() {
    try {
      const nextAmount = Math.abs(Number(amount) || 0)
      if (nextAmount <= 0) {
        throw new Error('Введите сумму больше нуля.')
      }

      const methodLabel = method === 'cash' ? 'Наличные' : 'Безналичные'

      if (type === 'income' || type === 'expense') {
        createManualFinanceTransaction({
          type,
          amount: nextAmount,
          account,
          method: methodLabel,
          category,
        })
      } else if (type === 'transfer') {
        createFinanceTransfer({
          fromAccount: account,
          toAccount: targetAccount,
          amount: nextAmount,
          method: methodLabel,
        })
      } else {
        const nextReceived = Math.abs(Number(receivedAmount) || 0)
        if (nextReceived <= 0) {
          throw new Error('Введите сумму получения больше нуля.')
        }
        createFinanceConversion({
          fromAccount: account,
          toAccount: targetAccount,
          fromAmount: nextAmount,
          toAmount: nextReceived,
          method: methodLabel,
        })
      }

      setError('')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить операцию.')
    }
  }

  return (
    <SidePanel title={titles[type]} onClose={onClose}>
      <div className="flex-1 space-y-6 overflow-y-auto p-7">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <p className="text-[13px] text-muted-foreground">Источник</p>
            <p className="mt-1 text-[15px] font-bold text-foreground">{account}</p>
          </div>
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <p className="text-[13px] text-muted-foreground">Способ</p>
            <p className="mt-1 text-[15px] font-bold text-foreground">
              {method === 'cash' ? 'Наличные' : 'Безналичные'}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-muted-foreground">Счет</label>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <select
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                className="h-13 w-full appearance-none rounded-2xl bg-card px-4 py-3.5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-primary/40"
              >
                {accountOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-card p-1 ring-1 ring-border">
              {(['cash', 'cashless'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setMethod(item)}
                  className={cn(
                    'rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-all',
                    method === item
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item === 'cash' ? 'Наличные' : 'Безналичные'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {type === 'transfer' || type === 'conversion' ? (
          <div>
            <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
              Счет назначения
            </label>
            <div className="relative">
              <select
                value={targetAccount}
                onChange={(event) => setTargetAccount(event.target.value)}
                className="h-13 w-full appearance-none rounded-2xl bg-card px-4 py-3.5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-primary/40"
              >
                {accountOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        ) : null}

        <div className={cn(type === 'conversion' ? 'grid grid-cols-2 gap-5' : '')}>
          <div>
            <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
              {type === 'conversion' ? 'Списать' : 'Сумма'}
            </label>
            <div className="flex items-center rounded-2xl bg-card ring-1 ring-primary/40">
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                className="h-13 min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[16px] font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <span className="px-4 text-[14px] font-semibold text-muted-foreground">UZS</span>
            </div>
          </div>

          {type === 'conversion' ? (
            <div>
              <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
                Получить
              </label>
              <div className="flex items-center rounded-2xl bg-card ring-1 ring-primary/40">
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(event) => setReceivedAmount(event.target.value)}
                  placeholder="0"
                  className="h-13 min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[16px] font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                />
                <span className="px-4 text-[14px] font-semibold text-muted-foreground">UZS</span>
              </div>
            </div>
          ) : null}
        </div>

        {type === 'income' || type === 'expense' ? (
          <div>
            <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
              Категория
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-13 w-full appearance-none rounded-2xl bg-card px-4 py-3.5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-primary/40"
              >
                <option value="">Выберите категорию</option>
                {categoryOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[13px] font-medium text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-7 py-5">
        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          Сохранить
        </button>
      </div>

      {done ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl ring-1 ring-border">
            <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-chart-2/10">
              <Check className="size-8 text-chart-2" />
            </span>
            <h3 className="text-xl font-black text-foreground">Операция добавлена</h3>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              Готово
            </button>
          </div>
        </div>
      ) : null}
    </SidePanel>
  )
}

function ShiftClosurePanel({ onClose }: { onClose: () => void }) {
  const accounts = useMemo(() => {
    const rows = getFinanceAccountsSummary().rows
    return rows.length > 0 ? rows.map((row) => `Касса ${row.name}`) : ['Касса Магазин посуды']
  }, [])

  const [account, setAccount] = useState(accounts[0] ?? 'Касса Магазин посуды')
  const [sentAmount, setSentAmount] = useState('')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function handleSave() {
    try {
      createFinanceShiftClosure({
        account,
        sentAmount: Number(sentAmount) || 0,
        receivedAmount: Number(receivedAmount) || 0,
      })
      setError('')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось закрыть смену.')
    }
  }

  return (
    <SidePanel title="Закрытие смены" onClose={onClose}>
      <div className="flex-1 space-y-6 overflow-y-auto p-7">
        <div>
          <label className="mb-2 block text-[13px] font-medium text-muted-foreground">Счет</label>
          <div className="relative">
            <select
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              className="h-13 w-full appearance-none rounded-2xl bg-card px-4 py-3.5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-primary/40"
            >
              {accounts.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
              Отправлено
            </label>
            <div className="flex items-center rounded-2xl bg-card ring-1 ring-primary/40">
              <input
                type="number"
                value={sentAmount}
                onChange={(event) => setSentAmount(event.target.value)}
                placeholder="0"
                className="h-13 min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[16px] font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <span className="px-4 text-[14px] font-semibold text-muted-foreground">UZS</span>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
              Получено
            </label>
            <div className="flex items-center rounded-2xl bg-card ring-1 ring-primary/40">
              <input
                type="number"
                value={receivedAmount}
                onChange={(event) => setReceivedAmount(event.target.value)}
                placeholder="0"
                className="h-13 min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[16px] font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <span className="px-4 text-[14px] font-semibold text-muted-foreground">UZS</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[13px] font-medium text-destructive">
            {error}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border px-7 py-5">
        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          Провести закрытие
        </button>
      </div>

      {done ? (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl ring-1 ring-border">
            <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-chart-2/10">
              <Check className="size-8 text-chart-2" />
            </span>
            <h3 className="text-xl font-black text-foreground">Смена закрыта</h3>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              Готово
            </button>
          </div>
        </div>
      ) : null}
    </SidePanel>
  )
}

export function FinanceTransactions() {
  const [tab, setTab] = useState<TabId>('transactions')
  const [query, setQuery] = useState('')
  const [showStats, setShowStats] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [panel, setPanel] = useState<AddType | null>(null)
  const [shiftPanel, setShiftPanel] = useState(false)
  const [realTransactions, setRealTransactions] = useState<ErpFinanceTransaction[]>([])
  const [shifts, setShifts] = useState<ErpFinanceShift[]>([])
  const [transfers, setTransfers] = useState<ErpFinanceTransfer[]>([])
  const [conversions, setConversions] = useState<ErpFinanceConversion[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  useEffect(() => {
    function load() {
      setRealTransactions(readFinanceTransactions())
      setShifts(readFinanceShifts())
      setTransfers(readFinanceTransfers())
      setConversions(readFinanceConversions())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [pageSize, query, tab])

  const mappedTransactions = useMemo(
    () =>
      realTransactions
        .filter(
          (item) =>
            item.sourceType === 'sale' ||
            item.sourceType === 'income' ||
            item.sourceType === 'expense' ||
            item.sourceType === 'supplier_payment',
        )
        .map(mapFinanceTransaction),
    [realTransactions],
  )

  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return mappedTransactions
    return mappedTransactions.filter((item) =>
      [item.id, item.operation, item.account, item.method].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [mappedTransactions, query])

  const filteredShifts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return shifts
    return shifts.filter((item) =>
      [item.id, item.account, item.cashier, item.receivedBy].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [query, shifts])

  const filteredTransfers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return transfers
    return transfers.filter((item) =>
      [item.id, item.fromAccount, item.toAccount, item.cashier].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [query, transfers])

  const filteredConversions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return conversions
    return conversions.filter((item) =>
      [item.id, item.fromAccount, item.toAccount, item.cashier].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [conversions, query])

  const summary = useMemo(() => {
    const totals = {
      income: { cash: 0, cashless: 0 },
      expense: { cash: 0, cashless: 0 },
      transfer: { cash: 0, cashless: 0 },
      conversion: { cash: 0, cashless: 0 },
    }

    for (const transaction of realTransactions) {
      const key = transaction.method.toLowerCase().includes('нал') ? 'cash' : 'cashless'
      const amount = Math.abs(transaction.amount)
      if (transaction.sourceType === 'sale' || transaction.sourceType === 'income') {
        totals.income[key] += amount
      } else if (
        transaction.sourceType === 'expense' ||
        transaction.sourceType === 'supplier_payment'
      ) {
        totals.expense[key] += amount
      } else if (transaction.sourceType === 'transfer') {
        totals.transfer[key] += amount
      } else if (transaction.sourceType === 'conversion') {
        totals.conversion[key] += amount
      }
    }

    return totals
  }, [realTransactions])

  const pagedTransactions = useMemo(
    () =>
      queryItems(filteredTransactions, {
        page,
        pageSize,
      }),
    [filteredTransactions, page, pageSize],
  )

  const pagedShifts = useMemo(
    () =>
      queryItems(filteredShifts, {
        page,
        pageSize,
      }),
    [filteredShifts, page, pageSize],
  )

  const pagedTransfers = useMemo(
    () =>
      queryItems(filteredTransfers, {
        page,
        pageSize,
      }),
    [filteredTransfers, page, pageSize],
  )

  const pagedConversions = useMemo(
    () =>
      queryItems(filteredConversions, {
        page,
        pageSize,
      }),
    [filteredConversions, page, pageSize],
  )

  const paged = tab === 'transactions'
    ? pagedTransactions
    : tab === 'shifts'
      ? pagedShifts
      : tab === 'transfers'
        ? pagedTransfers
        : pagedConversions

  const activeItems = tab === 'transactions'
    ? filteredTransactions
    : tab === 'shifts'
      ? filteredShifts
      : tab === 'transfers'
        ? filteredTransfers
        : filteredConversions

  function handleExportCsv() {
    if (tab === 'transactions') {
      exportCsv(
        filteredTransactions,
        [
          { header: 'ID', key: 'id' },
          { header: 'Дата', key: 'date' },
          { header: 'Время', key: 'time' },
          { header: 'Дата операции', key: 'opDate' },
          { header: 'Операция', key: 'operation' },
          { header: 'Тип', key: 'kind' },
          { header: 'Сумма', key: 'amount', format: (value) => money(Number(value) || 0, 'UZS') },
          { header: 'Счет', key: 'account' },
          { header: 'Метод', key: 'method' },
        ],
        `finance-transactions-${exportDateStamp()}`,
      )
      return
    }

    if (tab === 'shifts') {
      exportCsv(
        filteredShifts.map((item) => ({
          id: item.id.slice(-6),
          date: formatDate(item.createdAt),
          time: formatTime(item.createdAt),
          account: item.account,
          sentAmount: item.sentAmount,
          receivedAmount: item.receivedAmount,
          cashier: item.cashier,
          receivedBy: item.receivedBy,
          status: 'Принят',
        })),
        [
          { header: 'ID', key: 'id' },
          { header: 'Дата', key: 'date' },
          { header: 'Время', key: 'time' },
          { header: 'Счет', key: 'account' },
          { header: 'Отправлено', key: 'sentAmount', format: formatUzsCell },
          { header: 'Получено', key: 'receivedAmount', format: formatUzsCell },
          { header: 'Кассир', key: 'cashier' },
          { header: 'Принял', key: 'receivedBy' },
          { header: 'Статус', key: 'status' },
        ],
        `finance-shifts-${exportDateStamp()}`,
      )
      return
    }

    if (tab === 'transfers') {
      exportCsv(
        filteredTransfers.map((item) => ({
          id: item.id.slice(-6),
          date: formatDate(item.createdAt),
          time: formatTime(item.createdAt),
          fromAccount: item.fromAccount,
          toAccount: item.toAccount,
          amount: item.amount,
          method: item.method,
          cashier: item.cashier,
          status: 'Принят',
        })),
        [
          { header: 'ID', key: 'id' },
          { header: 'Дата', key: 'date' },
          { header: 'Время', key: 'time' },
          { header: 'Счет отправки', key: 'fromAccount' },
          { header: 'Счет получения', key: 'toAccount' },
          { header: 'Сумма', key: 'amount', format: formatUzsCell },
          { header: 'Метод', key: 'method' },
          { header: 'Кассир', key: 'cashier' },
          { header: 'Статус', key: 'status' },
        ],
        `finance-transfers-${exportDateStamp()}`,
      )
      return
    }

    exportCsv(
      filteredConversions.map((item) => ({
        id: item.id.slice(-6),
        date: formatDate(item.createdAt),
        time: formatTime(item.createdAt),
        fromAccount: item.fromAccount,
        toAccount: item.toAccount,
        fromAmount: item.fromAmount,
        toAmount: item.toAmount,
        method: item.method,
        cashier: item.cashier,
        status: 'Принят',
      })),
      [
        { header: 'ID', key: 'id' },
        { header: 'Дата', key: 'date' },
        { header: 'Время', key: 'time' },
        { header: 'Счет списания', key: 'fromAccount' },
        { header: 'Счет получения', key: 'toAccount' },
        { header: 'Списано', key: 'fromAmount', format: formatUzsCell },
        { header: 'Получено', key: 'toAmount', format: formatUzsCell },
        { header: 'Метод', key: 'method' },
        { header: 'Кассир', key: 'cashier' },
        { header: 'Статус', key: 'status' },
      ],
      `finance-conversions-${exportDateStamp()}`,
    )
  }

  function handleExportExcel() {
    if (tab === 'transactions') {
      exportExcel(
        filteredTransactions,
        [
          { header: 'ID', key: 'id' },
          { header: 'Дата', key: 'date' },
          { header: 'Время', key: 'time' },
          { header: 'Дата операции', key: 'opDate' },
          { header: 'Операция', key: 'operation' },
          { header: 'Тип', key: 'kind' },
          { header: 'Сумма', key: 'amount', format: (value) => money(Number(value) || 0, 'UZS') },
          { header: 'Счет', key: 'account' },
          { header: 'Метод', key: 'method' },
        ],
        `finance-transactions-${exportDateStamp()}`,
        'Транзакции',
      )
      return
    }

    if (tab === 'shifts') {
      exportExcel(
        filteredShifts.map((item) => ({
          id: item.id.slice(-6),
          date: formatDate(item.createdAt),
          time: formatTime(item.createdAt),
          account: item.account,
          sentAmount: item.sentAmount,
          receivedAmount: item.receivedAmount,
          cashier: item.cashier,
          receivedBy: item.receivedBy,
          status: 'Принят',
        })),
        [
          { header: 'ID', key: 'id' },
          { header: 'Дата', key: 'date' },
          { header: 'Время', key: 'time' },
          { header: 'Счет', key: 'account' },
          { header: 'Отправлено', key: 'sentAmount', format: formatUzsCell },
          { header: 'Получено', key: 'receivedAmount', format: formatUzsCell },
          { header: 'Кассир', key: 'cashier' },
          { header: 'Принял', key: 'receivedBy' },
          { header: 'Статус', key: 'status' },
        ],
        `finance-shifts-${exportDateStamp()}`,
        'Закрытие смен',
      )
      return
    }

    if (tab === 'transfers') {
      exportExcel(
        filteredTransfers.map((item) => ({
          id: item.id.slice(-6),
          date: formatDate(item.createdAt),
          time: formatTime(item.createdAt),
          fromAccount: item.fromAccount,
          toAccount: item.toAccount,
          amount: item.amount,
          method: item.method,
          cashier: item.cashier,
          status: 'Принят',
        })),
        [
          { header: 'ID', key: 'id' },
          { header: 'Дата', key: 'date' },
          { header: 'Время', key: 'time' },
          { header: 'Счет отправки', key: 'fromAccount' },
          { header: 'Счет получения', key: 'toAccount' },
          { header: 'Сумма', key: 'amount', format: formatUzsCell },
          { header: 'Метод', key: 'method' },
          { header: 'Кассир', key: 'cashier' },
          { header: 'Статус', key: 'status' },
        ],
        `finance-transfers-${exportDateStamp()}`,
        'Перемещения',
      )
      return
    }

    exportExcel(
      filteredConversions.map((item) => ({
        id: item.id.slice(-6),
        date: formatDate(item.createdAt),
        time: formatTime(item.createdAt),
        fromAccount: item.fromAccount,
        toAccount: item.toAccount,
        fromAmount: item.fromAmount,
        toAmount: item.toAmount,
        method: item.method,
        cashier: item.cashier,
        status: 'Принят',
      })),
      [
        { header: 'ID', key: 'id' },
        { header: 'Дата', key: 'date' },
        { header: 'Время', key: 'time' },
        { header: 'Счет списания', key: 'fromAccount' },
        { header: 'Счет получения', key: 'toAccount' },
        { header: 'Списано', key: 'fromAmount', format: formatUzsCell },
        { header: 'Получено', key: 'toAmount', format: formatUzsCell },
        { header: 'Метод', key: 'method' },
        { header: 'Кассир', key: 'cashier' },
        { header: 'Статус', key: 'status' },
      ],
      `finance-conversions-${exportDateStamp()}`,
      'Конвертации',
    )
  }

  function handleExportJson() {
    exportJson(
      {
        generatedAt: new Date().toISOString(),
        tab,
        query,
        total: activeItems.length,
        items: activeItems,
      },
      `finance-${tab}-${exportDateStamp()}`,
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-[34px]">
          Финансовые транзакции
        </h1>
        <button
          onClick={() => setShowStats((value) => !value)}
          className="flex items-center gap-1.5 text-[15px] font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {showStats ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {showStats ? 'Скрыть статистику' : 'Показать статистику'}
        </button>
      </div>

      {showStats ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={ArrowDownLeft}
            title="Сумма доходов"
            cash={`${plain(summary.income.cash)} UZS`}
            cashless={`${plain(summary.income.cashless)} UZS`}
          />
          <StatCard
            icon={ArrowUpRight}
            title="Сумма расходов"
            cash={`${plain(summary.expense.cash)} UZS`}
            cashless={`${plain(summary.expense.cashless)} UZS`}
          />
          <StatCard
            icon={ArrowLeftRight}
            title="Сумма перемещений"
            cash={`${plain(summary.transfer.cash)} UZS`}
            cashless={`${plain(summary.transfer.cashless)} UZS`}
          />
          <StatCard
            icon={DollarSign}
            title="Сумма конвертаций"
            cash={`${plain(summary.conversion.cash)} UZS`}
            cashless={`${plain(summary.conversion.cashless)} UZS`}
          />
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-semibold transition-colors',
              tab === item.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.badge ? <AlertCircle className="size-4 text-chart-4" /> : null}
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID, операция, счет"
            className="h-14 w-full rounded-2xl bg-card pl-12 pr-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setQuery('')}
          className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-card px-7 text-[15px] font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Filter className="size-4 text-primary" />
          Фильтры
        </button>
        {tab === 'shifts' ? (
          <button
            onClick={() => setShiftPanel(true)}
            className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Plus className="size-5" />
            Закрыть смену
          </button>
        ) : (
          <div className="relative shrink-0">
            <button
              onClick={() => setAddOpen((value) => !value)}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              <Plus className="size-5" />
              Добавить
            </button>

            {addOpen ? (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setAddOpen(false)} />
                <div className="absolute right-0 top-16 z-30 w-60 overflow-hidden rounded-2xl bg-card py-2 shadow-2xl ring-1 ring-border">
                  {addOptions.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setPanel(item.id)
                          setAddOpen(false)
                        }}
                        className="flex w-full items-center gap-3 px-5 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        <Icon className={cn('size-5', item.color)} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border">
        {tab === 'transactions' ? (
          <TxnsTable list={pagedTransactions.items} />
        ) : tab === 'shifts' ? (
          <ShiftsTable list={pagedShifts.items} />
        ) : tab === 'transfers' ? (
          <TransfersTable list={pagedTransfers.items} />
        ) : (
          <ConversionsTable list={pagedConversions.items} />
        )}
      </div>
      <div className="mt-6">
        <DataPagination
          page={paged.page}
          totalPages={paged.totalPages}
          pageSize={paged.pageSize}
          total={paged.total}
          onPage={setPage}
          onPageSize={setPageSize}
          exportButton={
            <ExportActions onCsv={handleExportCsv} onExcel={handleExportExcel} onJson={handleExportJson} />
          }
        />
      </div>

      {panel ? <NewTransactionPanel type={panel} onClose={() => setPanel(null)} /> : null}
      {shiftPanel ? <ShiftClosurePanel onClose={() => setShiftPanel(false)} /> : null}
    </>
  )
}

function mapFinanceTransaction(transaction: ErpFinanceTransaction): Txn {
  return {
    id: transaction.id.replace(/\D/g, '').slice(-6).padStart(6, '0'),
    date: formatDate(transaction.createdAt),
    time: formatTime(transaction.createdAt),
    opDate: formatDate(transaction.operationDate),
    operation: transaction.operation,
    kind:
      transaction.kind === 'cashflow'
        ? 'ДДС'
        : transaction.kind === 'through'
          ? 'Сквозной'
          : 'ПиУ',
    amount: transaction.amount,
    currency: transaction.currency,
    account: transaction.account,
    method: transaction.method,
    positive: transaction.amount >= 0,
  }
}

function EmptyState({ title }: { title: string }) {
  return <div className="px-6 py-10 text-center text-[15px] text-muted-foreground">{title}</div>
}

function TxnsTable({ list }: { list: Txn[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[820px]">
        <div className="grid grid-cols-[80px_130px_110px_1.4fr_100px_150px_1.2fr] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>ID</span>
          <span>Дата</span>
          <span>Дата операции</span>
          <span>Операция</span>
          <span>Тип</span>
          <span>Сумма</span>
          <span>Счет</span>
        </div>
        {list.length === 0 ? (
          <EmptyState title="Транзакции пока не найдены" />
        ) : (
          list.map((item) => (
            <div
              key={`${item.id}-${item.date}-${item.time}`}
              className="grid grid-cols-[80px_130px_110px_1.4fr_100px_150px_1.2fr] items-center gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-secondary/40"
            >
              <span className="text-[14px] font-medium tabular-nums text-muted-foreground">
                {item.id}
              </span>
              <span className="text-[13px] text-foreground">
                {item.date}
                <br />
                <span className="text-muted-foreground">{item.time}</span>
              </span>
              <span className="text-[13px] text-muted-foreground">{item.opDate}</span>
              <span className="text-[14px] font-semibold text-primary">{item.operation}</span>
              <span>
                <span className={cn('inline-flex rounded-full px-3 py-1 text-[12px] font-bold', kindBadge[item.kind])}>
                  {item.kind}
                </span>
              </span>
              <span>
                <span
                  className={cn(
                    'inline-flex rounded-full px-3.5 py-1.5 text-[13px] font-bold tabular-nums',
                    item.positive
                      ? 'bg-chart-2/15 text-chart-2'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {money(item.amount, item.currency)}
                </span>
              </span>
              <span className="text-[13px]">
                <span className="font-medium text-foreground">{item.account}</span>
                <br />
                <span className="text-muted-foreground">{item.method}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ShiftsTable({ list }: { list: ErpFinanceShift[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[90px_130px_1.4fr_1.2fr_140px_120px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>ID</span>
          <span>Дата</span>
          <span>Транзакция</span>
          <span>Счет отправки</span>
          <span>Сумма</span>
          <span>Статус</span>
        </div>
        {list.length === 0 ? (
          <EmptyState title="Закрытий смен пока не проводилось" />
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[90px_130px_1.4fr_1.2fr_140px_120px] items-center gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-secondary/40"
            >
              <span className="text-[14px] font-medium tabular-nums text-muted-foreground">
                {item.id.slice(-6)}
              </span>
              <span className="text-[13px] text-foreground">
                {formatDate(item.createdAt)}
                <br />
                <span className="text-muted-foreground">{formatTime(item.createdAt)}</span>
              </span>
              <span className="flex items-center gap-2 text-[14px] font-semibold text-primary">
                <AlertCircle className="size-4 text-chart-4" />
                Закрытие смены #{item.id.slice(-6)}
              </span>
              <span className="text-[13px] font-medium text-foreground">{item.account}</span>
              <span className="space-y-1 text-[13px] tabular-nums">
                <span className="flex items-center gap-1.5 text-primary">
                  <ArrowUpRight className="size-3.5" />
                  {plain(item.sentAmount)}
                </span>
                <span className="flex items-center gap-1.5 text-chart-2">
                  <Check className="size-3.5" />
                  {plain(item.receivedAmount)}
                </span>
              </span>
              <span>
                <span className="inline-flex rounded-full bg-chart-2/15 px-4 py-1.5 text-[13px] font-bold text-chart-2">
                  Принят
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TransfersTable({ list }: { list: ErpFinanceTransfer[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[90px_130px_1.3fr_1.2fr_1.2fr_120px_110px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>ID</span>
          <span>Дата</span>
          <span>Транзакция</span>
          <span>Счет отправки</span>
          <span>Счет получения</span>
          <span>Сумма</span>
          <span>Статус</span>
        </div>
        {list.length === 0 ? (
          <EmptyState title="Перемещений пока нет" />
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[90px_130px_1.3fr_1.2fr_1.2fr_120px_110px] items-center gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-secondary/40"
            >
              <span className="text-[14px] font-medium tabular-nums text-muted-foreground">
                {item.id.slice(-6)}
              </span>
              <span className="text-[13px] text-foreground">
                {formatDate(item.createdAt)}
                <br />
                <span className="text-muted-foreground">{formatTime(item.createdAt)}</span>
              </span>
              <span className="text-[14px] font-semibold text-primary">
                Перемещение #{item.id.slice(-6)}
              </span>
              <span className="text-[13px] font-medium text-foreground">{item.fromAccount}</span>
              <span className="text-[13px] font-medium text-foreground">{item.toAccount}</span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-primary tabular-nums">
                <ArrowLeftRight className="size-3.5" />
                {plain(item.amount)}
              </span>
              <span>
                <span className="inline-flex rounded-full bg-chart-2/15 px-4 py-1.5 text-[13px] font-bold text-chart-2">
                  Принят
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ConversionsTable({ list }: { list: ErpFinanceConversion[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[90px_130px_1.3fr_1.2fr_1.2fr_160px_110px] gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>ID</span>
          <span>Дата</span>
          <span>Транзакция</span>
          <span>Счет списания</span>
          <span>Счет получения</span>
          <span>Сумма</span>
          <span>Статус</span>
        </div>
        {list.length === 0 ? (
          <EmptyState title="Конвертаций пока нет" />
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[90px_130px_1.3fr_1.2fr_1.2fr_160px_110px] items-center gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-secondary/40"
            >
              <span className="text-[14px] font-medium tabular-nums text-muted-foreground">
                {item.id.slice(-6)}
              </span>
              <span className="text-[13px] text-foreground">
                {formatDate(item.createdAt)}
                <br />
                <span className="text-muted-foreground">{formatTime(item.createdAt)}</span>
              </span>
              <span className="text-[14px] font-semibold text-primary">
                Конвертация #{item.id.slice(-6)}
              </span>
              <span className="text-[13px] font-medium text-foreground">{item.fromAccount}</span>
              <span className="text-[13px] font-medium text-foreground">{item.toAccount}</span>
              <span className="text-[13px] font-semibold text-primary tabular-nums">
                {plain(item.fromAmount)} {'->'} {plain(item.toAmount)}
              </span>
              <span>
                <span className="inline-flex rounded-full bg-chart-2/15 px-4 py-1.5 text-[13px] font-bold text-chart-2">
                  Принят
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
