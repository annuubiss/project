'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  Calendar,
  ArrowRight,
  HandCoins,
  MessageSquare,
  Users,
  X,
  ChevronLeft,
  Phone,
  Store,
  UserCheck,
  CreditCard,
  Plus,
  Check,
  Smartphone,
  Wallet,
  Building2,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  formatDate,
  formatDateTime,
  getDebtSummary,
  repayDebt,
  readClients,
  type DebtSummary,
  type ErpClient,
  type ErpDebt,
} from '@/lib/erp/erp-store'

type DebtStatus = ErpDebt['status']

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Наличные', icon: Wallet },
  { id: 'uzcard', label: 'UzCard', icon: CreditCard },
  { id: 'payme', label: 'Payme', icon: Smartphone },
  { id: 'transfer', label: 'Перечисление', icon: Building2 },
  { id: 'click', label: 'Click', icon: Smartphone },
] as const

const mainTabs = ['Долги', 'Погашения']
const subTabs = ['Все', 'Просроченные', 'Непогашенные', 'Погашенные', 'Частично погашенные']

const emptySummary: DebtSummary = {
  totalDebtAmount: 0,
  totalPaidAmount: 0,
  totalRemainingAmount: 0,
  debtorCount: 0,
  overdueCount: 0,
  unpaidCount: 0,
  partialCount: 0,
  paidCount: 0,
  debts: [],
}

const statusDot: Record<DebtStatus, string> = {
  overdue: 'bg-destructive',
  unpaid: 'bg-chart-4',
  partial: 'bg-chart-5',
  paid: 'bg-chart-2',
}

export function Debts() {
  const [mainTab, setMainTab] = useState(0)
  const [subTab, setSubTab] = useState(0)
  const [query, setQuery] = useState('')
  const [summary, setSummary] = useState<DebtSummary>(emptySummary)
  const [clients, setClients] = useState<ErpClient[]>([])
  const [detailDebt, setDetailDebt] = useState<ErpDebt | null>(null)
  const [repayDebtItem, setRepayDebtItem] = useState<ErpDebt | null>(null)
  const [showBulk, setShowBulk] = useState(false)
  const [showSms, setShowSms] = useState(false)

  useEffect(() => {
    const load = () => {
      setSummary(getDebtSummary())
      setClients(readClients())
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

  const clientProfiles = useMemo(
    () =>
      new Map(
        clients.map((client) => [client.name.trim().toLowerCase(), client] as const),
      ),
    [clients],
  )

  const filtered = useMemo(() => {
    const statusFilter: DebtStatus | null =
      subTab === 1
        ? 'overdue'
        : subTab === 2
          ? 'unpaid'
          : subTab === 3
            ? 'paid'
            : subTab === 4
              ? 'partial'
              : null

    const source =
      mainTab === 0
        ? summary.debts
        : summary.debts.filter((debt) => debt.payments.length > 0)

    return source.filter((debt) => {
      const matchesQuery =
        debt.clientName.toLowerCase().includes(query.toLowerCase()) ||
        debt.store.toLowerCase().includes(query.toLowerCase()) ||
        debt.id.includes(query)
      const matchesStatus = !statusFilter || debt.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [mainTab, query, subTab, summary.debts])

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Долги клиентов
            </h1>
            <div className="flex items-center gap-2 rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border">
              <Calendar className="size-5 text-primary" />
              <span className="text-[15px] font-semibold text-foreground">Весь период</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
            {mainTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setMainTab(index)}
                className={cn(
                  'rounded-2xl py-3 text-[15px] font-semibold transition-colors',
                  mainTab === index
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {subTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setSubTab(index)}
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-[15px] font-semibold transition-colors',
                  subTab === index
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Клиент, магазин, номер долга"
                className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => {
                setQuery('')
                setMainTab(0)
                setSubTab(0)
              }}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <ChevronDown className="size-4 text-muted-foreground" />
              <Filter className="size-4 text-primary" />
              Фильтры
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map((debt) => (
              <div
                key={debt.id}
                className="flex cursor-pointer items-center gap-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
                onClick={() => setDetailDebt(debt)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => event.key === 'Enter' && setDetailDebt(debt)}
              >
                <span className={cn('size-3 shrink-0 rounded-full', statusDot[debt.status])} />
                <div className="min-w-[180px]">
                  <p className="text-[16px] font-bold text-primary">{formatMoney(debt.totalAmount)}</p>
                  <p className="text-[14px] text-muted-foreground">до {formatDate(debt.dueDate)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-foreground">
                    {debt.clientName}
                  </p>
                  <p className="truncate text-[14px] text-muted-foreground">{debt.store}</p>
                </div>
                <div className="min-w-[150px] text-right">
                  <p className="text-[14px] text-muted-foreground">Остаток</p>
                  <p className="text-[15px] font-bold text-destructive">
                    {formatMoney(debt.remainingAmount)}
                  </p>
                </div>
                {debt.remainingAmount > 0 && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setRepayDebtItem(debt)
                    }}
                    className="shrink-0 rounded-2xl bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
                  >
                    Погасить
                  </button>
                )}
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    setDetailDebt(debt)
                  }}
                  aria-label="Открыть долг"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-accent"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-16 ring-1 ring-border">
                <HandCoins className="size-12 text-muted-foreground/30" />
                <p className="mt-3 text-[15px] text-muted-foreground">Долги не найдены</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <button
            onClick={() => setShowBulk(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <span className="flex items-center gap-2">
              <HandCoins className="size-5" />
              Массовое погашение
            </span>
            <ArrowRight className="size-5" />
          </button>
          <button
            onClick={() => setShowSms(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              SMS-напоминания
            </span>
            <ArrowRight className="size-5" />
          </button>

          <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] text-muted-foreground">Сумма долгов</p>
                <p className="text-xl font-black text-primary">
                  {formatMoney(summary.totalDebtAmount)}
                </p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <HandCoins className="size-5" />
              </span>
            </div>
            <div className="space-y-3 border-t border-border pt-5">
              <StatRow label="Сумма погашений" value={formatMoney(summary.totalPaidAmount)} />
              <StatRow label="Остаток долгов" value={formatMoney(summary.totalRemainingAmount)} />
            </div>
          </div>

          <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] text-muted-foreground">Кол-во должников</p>
                <p className="text-2xl font-black text-primary">{summary.debtorCount} клиентов</p>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </span>
            </div>
            <div className="space-y-3 border-t border-border pt-5">
              <StatRow label="Погашенные" value={`${summary.paidCount} долгов`} />
              <StatRow label="Непогашенные" value={`${summary.unpaidCount} долгов`} />
              <StatRow label="Просроченные" value={`${summary.overdueCount} долгов`} />
              <StatRow label="Частичные" value={`${summary.partialCount} долгов`} />
            </div>
          </div>
        </aside>
      </div>

      {detailDebt && (
        <DebtDetailModal
          debt={detailDebt}
          clientProfile={clientProfiles.get(detailDebt.clientName.trim().toLowerCase()) ?? null}
          onClose={() => setDetailDebt(null)}
          onRepay={() => {
            setDetailDebt(null)
            setRepayDebtItem(detailDebt)
          }}
        />
      )}

      {repayDebtItem && (
        <RepaymentPanel
          debt={repayDebtItem}
          clientProfile={clientProfiles.get(repayDebtItem.clientName.trim().toLowerCase()) ?? null}
          onClose={() => setRepayDebtItem(null)}
          onDone={() => {
            setRepayDebtItem(null)
            setSummary(getDebtSummary())
          }}
        />
      )}

      {showBulk && (
        <BulkRepaymentPanel
          debts={summary.debts.filter((debt) => debt.remainingAmount > 0)}
          onClose={() => setShowBulk(false)}
          onDone={() => {
            setShowBulk(false)
            setSummary(getDebtSummary())
          }}
        />
      )}

      {showSms && (
        <SmsRemindersPanel
          debts={summary.debts.filter((debt) => debt.remainingAmount > 0)}
          onClose={() => setShowSms(false)}
        />
      )}
    </>
  )
}

function DebtDetailModal({
  debt,
  clientProfile,
  onClose,
  onRepay,
}: {
  debt: ErpDebt
  clientProfile: ErpClient | null
  onClose: () => void
  onRepay: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-card shadow-2xl ring-1 ring-border">
        <div className="flex items-start justify-between border-b border-border px-7 py-5">
          <div>
            <h2 className="text-2xl font-black text-foreground">{debt.clientName}</h2>
            <p className="mt-1 text-[15px] font-semibold text-destructive">
              {formatMoney(debt.remainingAmount)} до {formatDate(debt.dueDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          <div className="grid grid-cols-3 gap-4">
            <InfoCard label="Сумма долга" value={formatMoney(debt.totalAmount)} tone="text-primary" />
            <InfoCard label="Погашено" value={formatMoney(debt.paidAmount)} tone="text-chart-2" />
            <InfoCard label="Остаток" value={formatMoney(debt.remainingAmount)} tone="text-destructive" />
          </div>

          <div className="space-y-3">
            {[
              { label: 'ID долга', value: `#${debt.id}` },
              { label: 'Клиент', value: debt.clientName },
              { label: 'Телефон', value: debt.clientPhone || '-' },
              { label: 'Карта', value: clientProfile?.card || '-' },
              { label: 'Группа', value: clientProfile?.group || '-' },
              { label: 'Теги', value: clientProfile?.tags.join(', ') || '-' },
              { label: 'Срок погашения', value: formatDateTime(debt.dueDate) },
              { label: 'Магазин', value: debt.store },
              { label: 'Кассир', value: debt.cashier },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-secondary px-5 py-3.5"
              >
                <span className="text-[14px] text-muted-foreground">{item.label}</span>
                <span className="text-[14px] font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-[16px] font-bold text-foreground">История погашений</h3>
            {debt.payments.length > 0 ? (
              debt.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-2xl bg-secondary px-5 py-4"
                >
                  <div>
                    <p className="text-[14px] text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[14px] font-medium text-foreground">
                      {payment.methodLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-primary">
                      {formatMoney(payment.amount)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{payment.cashier}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-secondary px-5 py-4 text-[15px] text-muted-foreground">
                Погашений пока нет.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border px-7 py-5">
          <button
            onClick={onRepay}
            disabled={debt.remainingAmount <= 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <HandCoins className="size-5" />
            Погасить
          </button>
        </div>
      </div>
    </div>
  )
}

function RepaymentPanel({
  debt,
  clientProfile,
  onClose,
  onDone,
}: {
  debt: ErpDebt
  clientProfile: ErpClient | null
  onClose: () => void
  onDone: () => void
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const totalEntered = Object.values(amounts).reduce((sum, value) => sum + (Number(value) || 0), 0)

  function saveRepayment() {
    try {
      setError('')
      repayDebt({
        debtId: debt.id,
        payments: PAYMENT_METHODS.map((method) => ({
          methodId: method.id,
          label: method.label,
          amount: Number(amounts[method.id]) || 0,
        })),
      })
      setDone(true)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Не удалось погасить долг.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-full max-w-[900px] flex-col bg-background shadow-2xl">
        <div className="flex items-center gap-4 border-b border-border px-7 py-5">
          <button
            onClick={onClose}
            aria-label="Назад"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-black text-foreground">Погашение долга</h2>
          <div className="ml-auto">
            <button
              disabled={totalEntered <= 0}
              onClick={saveRepayment}
              className="rounded-2xl bg-primary px-8 py-3 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:bg-primary/90 disabled:opacity-40"
            >
              Погасить
            </button>
          </div>
        </div>

        <div className="flex flex-1 gap-0 overflow-hidden">
          <aside className="w-[260px] shrink-0 space-y-3 border-r border-border p-6">
            {[
              { label: 'ID долга', value: `#${debt.id}` },
              { label: 'Клиент', value: debt.clientName },
              { label: 'Телефон', value: debt.clientPhone || '-' },
              { label: 'Карта клиента', value: clientProfile?.card || '-' },
              { label: 'Группа клиента', value: clientProfile?.group || '-' },
              { label: 'Срок погашения', value: formatDate(debt.dueDate) },
              { label: 'Сумма долга', value: formatMoney(debt.totalAmount) },
              { label: 'Текущий магазин', value: debt.store },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <p className="text-[12px] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-[14px] font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </aside>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 grid grid-cols-2 gap-4">
              <InfoCard label="Текущее погашение" value={formatMoney(totalEntered)} tone="text-primary" />
              <InfoCard
                label="Остаток долга"
                value={formatMoney(Math.max(0, debt.remainingAmount - totalEntered))}
                tone="text-destructive"
              />
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <div
                    key={method.id}
                    className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border transition-shadow focus-within:ring-2 focus-within:ring-primary/40"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-muted-foreground">{method.label}</p>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={amounts[method.id] ?? ''}
                        onChange={(event) =>
                          setAmounts((prev) => ({
                            ...prev,
                            [method.id]: event.target.value,
                          }))
                        }
                        className="mt-0.5 w-full bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setAmounts((prev) => ({
                          ...prev,
                          [method.id]: String(debt.remainingAmount),
                        }))
                      }
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {done && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-2xl ring-1 ring-border">
              <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-chart-2/10">
                <Check className="size-8 text-chart-2" />
              </span>
              <h3 className="text-xl font-black text-foreground">Погашение сохранено</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">
                В систему записано {formatMoney(totalEntered)}.
              </p>
              <button
                onClick={onDone}
                className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Готово
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BulkRepaymentPanel({
  debts,
  onClose,
  onDone,
}: {
  debts: ErpDebt[]
  onClose: () => void
  onDone: () => void
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function submitBulk() {
    try {
      setError('')
      let used = false
      for (const debt of debts) {
        const amount = Number(amounts[debt.id]) || 0
        if (amount <= 0) continue
        used = true
        repayDebt({
          debtId: debt.id,
          payments: [{ methodId: 'cash', label: 'Наличные', amount }],
        })
      }
      if (!used) {
        throw new Error('Введите хотя бы одну сумму погашения.')
      }
      setSaved(true)
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : 'Не удалось выполнить массовое погашение.',
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-3xl bg-card shadow-2xl ring-1 ring-border">
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <h2 className="text-2xl font-black text-foreground">Массовое погашение</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-7 py-6">
          {error ? (
            <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive">
              {error}
            </div>
          ) : null}
          {debts.map((debt) => (
            <div
              key={debt.id}
              className="grid grid-cols-[1.4fr_180px_180px] items-center gap-4 rounded-2xl bg-secondary px-5 py-4"
            >
              <div>
                <p className="text-[15px] font-semibold text-foreground">{debt.clientName}</p>
                <p className="text-[13px] text-muted-foreground">
                  {debt.store} | Остаток {formatMoney(debt.remainingAmount)}
                </p>
              </div>
              <span className="text-[14px] font-bold text-primary">
                {formatMoney(debt.totalAmount)}
              </span>
              <input
                type="number"
                min={0}
                max={debt.remainingAmount}
                value={amounts[debt.id] ?? ''}
                onChange={(event) =>
                  setAmounts((prev) => ({ ...prev, [debt.id]: event.target.value }))
                }
                placeholder="0"
                className="h-12 rounded-2xl bg-card px-4 text-[15px] font-semibold text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
        <div className="border-t border-border px-7 py-5">
          <button
            onClick={saved ? onDone : submitBulk}
            className="w-full rounded-2xl bg-primary py-4 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            {saved ? 'Готово' : 'Сохранить погашения'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SmsRemindersPanel({
  debts,
  onClose,
}: {
  debts: ErpDebt[]
  onClose: () => void
}) {
  const text = debts
    .map(
      (debt) =>
        `${debt.clientName}: напоминаем о долге ${formatMoney(debt.remainingAmount)} до ${formatDate(debt.dueDate)}.`,
    )
    .join('\n')

  async function copyReminders() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-card shadow-2xl ring-1 ring-border">
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <h2 className="text-2xl font-black text-foreground">SMS-напоминания</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4 px-7 py-6">
          <p className="text-[15px] text-muted-foreground">
            Система подготовила текстовые напоминания по всем активным долгам. Их
            можно скопировать и использовать в вашей SMS-интеграции.
          </p>
          <textarea
            readOnly
            value={text}
            className="min-h-[320px] w-full resize-none rounded-2xl bg-secondary px-4 py-4 text-[14px] text-foreground outline-none"
          />
        </div>
        <div className="border-t border-border px-7 py-5">
          <button
            onClick={copyReminders}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Copy className="size-5" />
            Скопировать напоминания
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="rounded-2xl bg-secondary p-4">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-[16px] font-bold', tone)}>{value}</p>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[15px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}

function formatMoney(value: number) {
  return `${formatUZS(value)} UZS`
}
