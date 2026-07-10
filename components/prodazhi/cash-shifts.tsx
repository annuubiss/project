'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowRight,
  Wallet,
  Lock,
  Unlock,
  Clock,
  User,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileBarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  closeCashShift,
  formatDateTime,
  getCashShiftSummaryRows,
  getCurrentShift,
  openCashShift,
  printXReport,
  printZReport,
  readCashRegisters,
  type CashShiftSummaryRow,
} from '@/lib/erp/erp-store'

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' UZS'
}

function fmtSigned(n: number) {
  return (n >= 0 ? '+' : '-') + ' ' + Math.abs(n).toLocaleString('ru-RU') + ' UZS'
}

function shiftDiff(shift: CashShiftSummaryRow) {
  return shift.pay.reduce(
    (sum, payment) => sum + (((payment.actual ?? payment.expected) || 0) - payment.expected),
    0,
  )
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  )
}

function OpenShiftModal({
  onClose,
  onOpen,
}: {
  onClose: () => void
  onOpen: (openingCash: number, store: string, registerId: string | null) => void
}) {
  const registers = readCashRegisters().filter((item) => item.status === 'active')
  const [amount, setAmount] = useState('500000')
  const [registerId, setRegisterId] = useState(registers[0]?.id ?? '')
  const selectedRegister = registers.find((item) => item.id === registerId)
  const numeric = Number(amount.replace(/\D/g, ''))

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-card p-7 shadow-2xl ring-1 ring-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Открыть кассу</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-foreground">Магазин / касса</label>
            <div className="relative">
              <select
                value={registerId}
                onChange={(event) => setRegisterId(event.target.value)}
                className="h-14 w-full appearance-none rounded-2xl bg-secondary px-5 pr-10 text-[15px] font-medium text-foreground outline-none ring-1 ring-transparent transition-shadow focus:bg-card focus:ring-2 focus:ring-primary/40"
              >
                {registers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[14px] font-semibold text-foreground">Разменная сумма (наличные)</label>
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
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl bg-secondary px-7 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Отмена
          </button>
          <button
            onClick={() => onOpen(numeric, selectedRegister?.store ?? 'Магазин', registerId || null)}
            className="rounded-2xl bg-primary px-8 py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Открыть смену
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseShiftModal({
  shift,
  onClose,
  onConfirm,
}: {
  shift: CashShiftSummaryRow
  onClose: () => void
  onConfirm: (actuals: Record<string, number>) => void
}) {
  const [actuals, setActuals] = useState<Record<string, string>>(
    Object.fromEntries(shift.pay.map((item) => [item.method, String(item.expected)])),
  )

  const rows = shift.pay.map((item) => {
    const actual = Number(actuals[item.method]?.replace(/\D/g, '') || 0)
    return { ...item, actual, diff: actual - item.expected }
  })
  const totalExpected = rows.reduce((sum, item) => sum + item.expected, 0)
  const totalActual = rows.reduce((sum, item) => sum + item.actual, 0)
  const totalDiff = totalActual - totalExpected

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-card p-7 shadow-2xl ring-1 ring-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Закрыть кассу</h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Смена #{shift.id.slice(-6)} · {shift.cashier}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-border">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 bg-secondary px-4 py-3 text-[13px] font-semibold text-muted-foreground">
            <span>Тип оплаты</span>
            <span className="text-right">Ожидается</span>
            <span className="text-right">Фактически</span>
            <span className="text-right">Разница</span>
          </div>
          {rows.map((item) => (
            <div
              key={item.method}
              className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 border-t border-border px-4 py-3"
            >
              <span className="text-[14px] font-semibold text-foreground">{item.method}</span>
              <span className="text-right text-[14px] text-muted-foreground">{fmt(item.expected)}</span>
              <div className="flex justify-end">
                <input
                  value={actuals[item.method]}
                  onChange={(event) =>
                    setActuals((prev) => ({ ...prev, [item.method]: event.target.value }))
                  }
                  inputMode="numeric"
                  className="h-9 w-28 rounded-xl bg-secondary px-3 text-right text-[14px] font-semibold text-foreground outline-none ring-1 ring-transparent focus:bg-card focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <span
                className={cn(
                  'text-right text-[14px] font-bold',
                  item.diff === 0
                    ? 'text-muted-foreground'
                    : item.diff > 0
                      ? 'text-success'
                      : 'text-destructive',
                )}
              >
                {item.diff === 0 ? '0 UZS' : fmtSigned(item.diff)}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 border-t border-border bg-secondary/60 px-4 py-3">
            <span className="text-[14px] font-black text-foreground">Итого</span>
            <span className="text-right text-[14px] font-bold text-foreground">{fmt(totalExpected)}</span>
            <span className="text-right text-[14px] font-bold text-foreground">{fmt(totalActual)}</span>
            <span
              className={cn(
                'text-right text-[14px] font-black',
                totalDiff === 0
                  ? 'text-muted-foreground'
                  : totalDiff > 0
                    ? 'text-success'
                    : 'text-destructive',
              )}
            >
              {totalDiff === 0 ? '0 UZS' : fmtSigned(totalDiff)}
            </span>
          </div>
        </div>

        {totalDiff !== 0 ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-semibold text-destructive">
            <AlertTriangle className="size-5" />
            Обнаружено расхождение: {fmtSigned(totalDiff)}
          </div>
        ) : null}

        <div className="mt-7 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl bg-secondary px-7 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Отмена
          </button>
          <button
            onClick={() =>
              onConfirm(Object.fromEntries(rows.map((item) => [item.method, item.actual])))
            }
            className="rounded-2xl bg-primary px-8 py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Закрыть смену
          </button>
        </div>
      </div>
    </div>
  )
}

type DiscFilter = 'all' | 'match' | 'mismatch'

export function CashShifts() {
  const [expanded, setExpanded] = useState(true)
  const [query, setQuery] = useState('')
  const [shifts, setShifts] = useState<CashShiftSummaryRow[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [closingShift, setClosingShift] = useState<CashShiftSummaryRow | null>(null)
  const [discFilter, setDiscFilter] = useState<DiscFilter>('all')

  useEffect(() => {
    function load() {
      setShifts(getCashShiftSummaryRows())
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
    return shifts.filter((shift) => {
      const matchesQuery =
        !q ||
        shift.id.includes(q) ||
        shift.cashier.toLowerCase().includes(q) ||
        shift.store.toLowerCase().includes(q)
      if (!matchesQuery) return false
      if (discFilter === 'all') return true
      const hasDiff = shift.status === 'closed' && shiftDiff(shift) !== 0
      return discFilter === 'mismatch' ? hasDiff : !hasDiff
    })
  }, [discFilter, query, shifts])

  const totalSales = shifts.reduce((sum, shift) => sum + shift.salesTotal, 0)
  const openShifts = shifts.filter((shift) => shift.status === 'open').length
  const mismatchCount = shifts.filter(
    (shift) => shift.status === 'closed' && shiftDiff(shift) !== 0,
  ).length

  function handleOpen(openingCash: number, store: string, registerId: string | null) {
    openCashShift({
      store,
      openingCash,
      registerId,
    })
    setOpenModal(false)
  }

  function handleClose(actualByMethod: Record<string, number>) {
    if (!closingShift) return
    const closed = closeCashShift({
      shiftId: closingShift.id,
      actualByMethod,
    })
    setClosingShift(null)
    // Автоматически печатаем Z-отчёт после закрытия
    printZReport(closed.id)
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Кассовые смены
            </h1>
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-[15px] font-bold text-muted-foreground">
              {shifts.length}
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
              placeholder="ID смены, кассир, магазин"
              className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={() => {
              setQuery('')
              setDiscFilter('all')
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
              { id: 'match', label: 'Без расхождений' },
              { id: 'mismatch', label: 'С расхождениями' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setDiscFilter(item.id)}
              className={cn(
                'rounded-2xl px-5 py-2.5 text-[14px] font-semibold transition-colors',
                discFilter === item.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'bg-card text-foreground ring-1 ring-border hover:bg-secondary',
              )}
            >
              {item.label}
              {item.id === 'mismatch' && mismatchCount > 0 ? (
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-[12px] font-bold',
                    discFilter === item.id
                      ? 'bg-primary-foreground/20'
                      : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {mismatchCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="rounded-2xl bg-card px-4 py-2 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border">
            Активные смены
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
                <p className="text-[15px] font-semibold text-foreground">Смены не найдены</p>
              </div>
            ) : (
              filtered.map((shift) => {
                const diff = shift.status === 'closed' ? shiftDiff(shift) : 0
                return (
                  <div
                    key={shift.id}
                    className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'flex size-12 shrink-0 items-center justify-center rounded-2xl',
                          shift.status === 'open'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-muted-foreground',
                        )}
                      >
                        {shift.status === 'open' ? <Unlock className="size-5" /> : <Lock className="size-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[15px] font-bold text-foreground">Смена #{shift.id.slice(-6)}</p>
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
                              shift.status === 'open'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-muted-foreground',
                            )}
                          >
                            {shift.status === 'open' ? 'Открыта' : 'Закрыта'}
                          </span>
                          {shift.status === 'closed' && diff !== 0 ? (
                            <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[12px] font-semibold text-destructive">
                              <AlertTriangle className="size-3" />
                              Расхождение
                            </span>
                          ) : null}
                          {shift.status === 'closed' && diff === 0 ? (
                            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[12px] font-semibold text-success">
                              <CheckCircle2 className="size-3" />
                              Сходится
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-muted-foreground">
                          <User className="size-3.5" />
                          {shift.cashier}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-[15px] font-bold text-primary">{fmt(shift.salesTotal)}</p>
                        <p className="flex items-center justify-end gap-1.5 text-[14px] text-muted-foreground">
                          <span className="size-2 rounded-full bg-primary" />
                          {shift.store}
                        </p>
                      </div>
                      {shift.status === 'open' ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => printXReport(shift.id)}
                            title="X-отчёт (промежуточный)"
                            className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5 text-[13px] font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-accent"
                          >
                            <FileText className="size-4 text-primary" />
                            X
                          </button>
                          <button
                            onClick={() => setClosingShift(shift)}
                            className="rounded-2xl bg-destructive px-4 py-2.5 text-[14px] font-bold text-destructive-foreground transition-colors hover:bg-destructive/90"
                          >
                            Закрыть
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => printZReport(shift.id)}
                          title="Z-отчёт"
                          className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5 text-[13px] font-semibold text-foreground ring-1 ring-border transition-colors hover:bg-accent"
                        >
                          <FileBarChart2 className="size-4 text-primary" />
                          Z
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
                          <Clock className="size-3.5" /> Открытие
                        </p>
                        <p className="text-[14px] font-semibold text-foreground">
                          {formatDateTime(shift.openedAt)}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
                          <Clock className="size-3.5" /> Закрытие
                        </p>
                        <p className="text-[14px] font-semibold text-foreground">
                          {shift.closedAt ? formatDateTime(shift.closedAt) : '-'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] text-muted-foreground">Касса на начало</p>
                        <p className="text-[14px] font-semibold text-foreground">{fmt(shift.openingCash)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] text-muted-foreground">
                          {shift.status === 'closed' ? 'Разница' : 'Касса на конец'}
                        </p>
                        <p
                          className={cn(
                            'text-[14px] font-semibold',
                            shift.status === 'closed' && diff !== 0
                              ? diff > 0
                                ? 'text-success'
                                : 'text-destructive'
                              : 'text-foreground',
                          )}
                        >
                          {shift.status === 'closed' ? (diff === 0 ? '0 UZS' : fmtSigned(diff)) : '-'}
                        </p>
                      </div>
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
          onClick={() => setOpenModal(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          Открыть новую смену
          <Plus className="size-5" />
        </button>

        {/* Кнопки X/Z для текущей открытой смены */}
        {shifts.filter((s) => s.status === 'open').map((s) => (
          <div key={s.id} className="space-y-2 rounded-3xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-[13px] font-semibold text-muted-foreground">
              Текущая смена #{s.id.slice(-6)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => printXReport(s.id)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-[14px] font-bold text-foreground ring-1 ring-border transition-colors hover:bg-accent"
              >
                <FileText className="size-4 text-primary" />
                X-отчёт
              </button>
              <button
                onClick={() => setClosingShift(s)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-3 text-[14px] font-bold text-destructive ring-1 ring-destructive/20 transition-colors hover:bg-destructive/20"
              >
                <FileBarChart2 className="size-4" />
                Закрыть / Z
              </button>
            </div>
          </div>
        ))}

        <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] text-muted-foreground">Смены</p>
              <p className="text-2xl font-black text-foreground">{shifts.length} шт</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5">
            <ReportRow label="Открытые" value={`${openShifts} шт`} />
            <ReportRow label="Закрытые" value={`${shifts.length - openShifts} шт`} />
            <ReportRow label="Продаж всего" value={`${shifts.reduce((sum, item) => sum + item.salesCount, 0)} шт`} />
            <ReportRow label="С расхождением" value={`${mismatchCount} шт`} />
          </div>
        </div>

        <div className="space-y-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[15px] text-muted-foreground">Оборот за период</p>
              <p className="text-2xl font-black text-primary">{fmt(totalSales)}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
          </div>
        </div>
      </aside>

      {openModal ? <OpenShiftModal onClose={() => setOpenModal(false)} onOpen={handleOpen} /> : null}
      {closingShift ? (
        <CloseShiftModal
          shift={closingShift}
          onClose={() => setClosingShift(null)}
          onConfirm={handleClose}
        />
      ) : null}
    </div>
  )
}
