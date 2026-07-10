'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  FileText,
  History,
  Mail,
  Printer,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  cancelSale,
  formatDateTime,
  readSales,
  sendEmailReceipt,
  type ErpSale,
} from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'

type Tab = 'details' | 'payments' | 'history' | 'actions'

function fmt(value: number) {
  return `${formatUZS(value)} UZS`
}

function DetailRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-1.5 ${className || ''}`}>
      <span className="text-[15px] text-muted-foreground">{label}</span>
      <span className="text-right text-[15px] font-semibold text-foreground">{value}</span>
    </div>
  )
}

export function SaleDetailPage({ saleId }: { saleId: string }) {
  const [sale, setSale] = useState<ErpSale | null>(null)
  const [tab, setTab] = useState<Tab>('details')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  useEffect(() => {
    function load() {
      const sales = readSales()
      const found = sales.find((item) => item.id === saleId)
      setSale(found || null)
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [saleId])

  useEffect(() => {
    if (sale) setTab('details')
  }, [sale])

  const isCancelled = useMemo(() => sale?.cancelled || false, [sale])
  const canBeCancelled = useMemo(() => {
    if (!sale || sale.type !== 'sale' || isCancelled) return false
    const saleDate = new Date(sale.createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 24
  }, [sale, isCancelled])

  const history = useMemo(() => sale?.changeHistory || [], [sale])

  const handleSubmitCancel = async () => {
    if (!sale) return
    if (!cancelReason.trim()) {
      alert('Укажите причину отмены')
      return
    }
    if (!window.confirm('Вы уверены, что хотите отменить продажу?')) return

    setIsCanceling(true)
    try {
      await cancelSale({
        saleId: sale.id,
        reason: cancelReason,
      })
      alert('Продажа успешно отменена')
      setShowCancelModal(false)
      setCancelReason('')
      // Reloading via ERP_DATA_CHANGED event
      const sales = readSales()
      setSale(sales.find((item) => item.id === saleId) || null)
    } catch (error: any) {
      alert(error.message || 'Не удалось отменить продажу')
    } finally {
      setIsCanceling(false)
    }
  }

  const handleSubmitEmail = async () => {
    if (!sale) return
    if (!emailTo.trim() || !emailTo.includes('@')) {
      alert('Укажите корректный email получателя')
      return
    }

    setIsSendingEmail(true)
    try {
      const result = await sendEmailReceipt({
        saleId: sale.id,
        to: emailTo,
      })
      alert(result.message)
      setShowEmailModal(false)
      setEmailTo('')
    } catch (error: any) {
      alert(error.message || 'Не удалось отправить чек')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const printReceipt = () => {
    if (!sale) return

    const printWindow = window.open('', '_blank', 'width=420,height=720')
    if (!printWindow) return

    const rows = sale.lines
      .map(
        (line) => `
          <tr>
            <td>${line.name}</td>
            <td style="text-align: center;">${line.qty}</td>
            <td style="text-align: right;">${fmt(line.total)}</td>
          </tr>`,
      )
      .join('')

    const operationType =
      sale.type === 'return'
        ? 'Возврат'
        : sale.type === 'exchange'
          ? 'Обмен'
          : sale.saleChannel === 'wholesale'
            ? 'Оптовая'
            : 'Розничная'

    printWindow.document.write(`<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Чек #${sale.id}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
      h1 { margin: 0 0 8px; font-size: 20px; text-align: center; }
      .meta { margin-bottom: 16px; font-size: 12px; color: #4b5563; text-align: center; }
      .divider { height: 2px; background: #e5e7eb; margin: 16px 0; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      td, th { border-bottom: 1px solid #e5e7eb; padding: 8px 0; font-size: 12px; text-align: left; }
      td:last-child, th:last-child { text-align: right; }
      .total { margin-top: 16px; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
      .grand-total { margin-top: 8px; display: flex; justify-content: space-between; font-weight: 700; font-size: 16px; color: #10b981; border-top: 2px solid #10b981; padding-top: 8px; }
      .cancelled { margin-top: 16px; padding: 12px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; text-align: center; }
      .cancelled-text { color: #ef4444; font-weight: 700; font-size: 14px; }
    </style>
  </head>
  <body>
    <h1>${operationType} #${sale.id}</h1>
    <div class="meta">
      ${formatDateTime(sale.createdAt)}<br />
      ${sale.store}<br />
      ${sale.seller}
    </div>
    ${isCancelled ? `
    <div class="cancelled">
      <p class="cancelled-text">ДОКУМЕНТ ОТМЕНЕН</p>
      <p style="margin-top: 4px; font-size: 11px; color: #dc2626;">Причина: ${sale.cancellationReason}</p>
      <p style="margin-top: 4px; font-size: 11px; color: #dc2626;">Отменено: ${sale.cancelledAt ? formatDateTime(sale.cancelledAt) : ''}</p>
    </div>
    ` : ''}
    <div class="divider"></div>
    <table>
      <thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total"><span>Подытог</span><span>${fmt(sale.subtotal)}</span></div>
    <div class="total"><span>Скидка</span><span style="color: #dc2626;">-${fmt(sale.discount)}</span></div>
    <div class="grand-total"><span>Итого</span><span>${fmt(sale.total)}</span></div>
    ${sale.payments.length > 0 ? `
    <div style="margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #374151;">Оплата:</p>
      ${sale.payments.map(payment => `
        <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0;">
          <span>${payment.label}</span>
          <span>${fmt(payment.amount)}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}
  </body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 100)
  }

  if (!sale) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl bg-card shadow-sm ring-1 ring-border">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Продажа не найдена</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">Продажа с ID #{saleId} не найдена в системе</p>
          <Link
            href="/prodazhi/vse"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 size-4" />
            К списку продаж
          </Link>
        </div>
      </div>
    )
  }

  const operationType =
    sale.type === 'return'
      ? 'Возврат'
      : sale.type === 'exchange'
        ? 'Обмен'
        : sale.saleChannel === 'wholesale'
          ? 'Оптовая продажа'
          : 'Розничная продажа'

  const subtotal = sale.lines.reduce((sum, line) => sum + line.total, 0)
  const paid = sale.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const balance = sale.total - paid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/prodazhi/vse"
            className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {operationType} #{sale.id}
            </h1>
            <p className="text-[15px] text-muted-foreground">
              {formatDateTime(sale.createdAt)} · {sale.store}
            </p>
          </div>
        </div>
        {isCancelled && (
          <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-2 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
            <ShieldAlert className="size-5" />
            <span>Документ отменён</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 rounded-3xl bg-secondary/60 p-1.5">
        {[
          { id: 'details' as const, label: 'Детали', icon: FileText },
          { id: 'payments' as const, label: 'Оплата', icon: Wallet },
          { id: 'history' as const, label: 'История', icon: History },
          { id: 'actions' as const, label: 'Действия', icon: RotateCcw },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-semibold transition-colors',
              tab === item.id
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'details' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="mb-4 text-[15px] font-semibold text-foreground">Информация о продаже</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow label="Дата и время" value={formatDateTime(sale.createdAt)} />
              <DetailRow label="Тип операции" value={operationType} />
              <DetailRow label="Магазин" value={sale.store} />
              <DetailRow label="Продавец" value={sale.seller} />
              {sale.client && <DetailRow label="Клиент" value={sale.client} />}
              {sale.note && (
                <div className="col-span-1 sm:col-span-2">
                  <DetailRow label="Примечание" value={sale.note} />
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="mb-4 text-[15px] font-semibold text-foreground">Товары</h3>
            <div className="space-y-3">
              {sale.lines.map((line) => (
                <div
                  key={line.productId}
                  className="flex items-center gap-4 rounded-2xl bg-secondary/60 px-4 py-3"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
                    <span className="font-bold text-primary">{line.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground">{line.name}</p>
                    <p className="text-[13px] text-muted-foreground">{line.sku} · {line.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-primary">{fmt(line.total)}</p>
                    <p className="text-[13px] text-muted-foreground">{line.qty} шт · {fmt(line.unitPrice)} / шт</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="mb-4 text-[15px] font-semibold text-foreground">Финансовые итоги</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-muted-foreground">Подытог</span>
                <span className="text-[15px] font-semibold text-foreground">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-muted-foreground">Скидка</span>
                <span className="text-[15px] font-semibold text-destructive">-{fmt(sale.discount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-[15px] font-semibold text-foreground">Итого</span>
                <span
                  className={cn(
                    'text-xl font-black',
                    sale.total < 0 ? 'text-destructive' : 'text-primary',
                  )}
                >
                  {fmt(sale.total)}
                </span>
              </div>
              {balance !== 0 && (
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[15px] text-muted-foreground">Баланс</span>
                  <span className={cn('text-[15px] font-semibold', balance > 0 ? 'text-destructive' : 'text-success')}>
                    {fmt(balance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary/60 px-4 py-5 text-center ring-1 ring-border">
              <p className="text-[13px] text-muted-foreground">Итого</p>
              <p className="mt-2 text-[20px] font-bold text-foreground">{fmt(sale.total)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-4 py-5 text-center ring-1 ring-border">
              <p className="text-[13px] text-muted-foreground">Оплачено</p>
              <p className="mt-2 text-[20px] font-bold text-foreground">{fmt(paid)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-4 py-5 text-center ring-1 ring-border">
              <p className="text-[13px] text-muted-foreground">Разница</p>
              <p
                className={cn(
                  'mt-2 text-[20px] font-bold',
                  balance === 0 ? 'text-success' : 'text-destructive',
                )}
              >
                {fmt(balance)}
              </p>
            </div>
          </div>

          {/* Payments List */}
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h3 className="mb-4 text-[15px] font-semibold text-foreground">Способ оплаты</h3>
            {sale.payments.length > 0 ? (
              <div className="space-y-3">
                {sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-card text-primary">
                        <Wallet className="size-5" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-foreground">{payment.label}</p>
                        <p className="text-[13px] text-muted-foreground">ID: {payment.id}</p>
                      </div>
                    </div>
                    <span className="text-[15px] font-bold text-primary">{fmt(payment.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-secondary/60 px-4 py-8 text-center text-[15px] text-muted-foreground">
                По этой операции нет отдельной оплаты.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <h3 className="mb-4 text-[15px] font-semibold text-foreground">История изменений</h3>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((log) => (
                <div key={log.id} className="flex items-start gap-4 rounded-2xl bg-secondary/40 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <History className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-semibold text-foreground">{log.description}</p>
                      <span className="text-[13px] text-muted-foreground">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Изменено: {log.changedBy}
                    </p>
                    {log.details && (
                      <div className="mt-2 rounded-xl bg-card/50 p-3 text-[13px] text-muted-foreground">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b border-border/50 pb-1 last:border-0">
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium text-foreground">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-secondary/60 px-4 py-8 text-center text-[15px] text-muted-foreground">
              История изменений пуста
            </div>
          )}
        </div>
      )}

      {tab === 'actions' && (
        <div className="space-y-6">
          {/* Print Button */}
          <button
            onClick={printReceipt}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Printer className="size-5" />
            {isCancelled ? 'Распечатать отменённый чек' : 'Распечатать чек'}
          </button>

          {/* Email Button */}
          {!isCancelled && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-4 text-[16px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary/80"
            >
              <Mail className="size-5" />
              Отправить чек на email
            </button>
          )}

          {/* Cancel Button (only if can be cancelled) */}
          {!isCancelled && canBeCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-6 py-4 text-[16px] font-bold text-destructive-foreground shadow-md shadow-destructive/30 transition-colors hover:bg-destructive/90"
            >
              <Trash2 className="size-5" />
              Отменить продажу
            </button>
          )}

          {/* Cancel Button (already cancelled) */}
          {isCancelled && (
            <div className="rounded-2xl bg-destructive/10 px-6 py-4 text-[15px] text-destructive ring-1 ring-destructive/20">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="size-5" />
                Документ отменён
              </p>
              <p className="mt-1 text-[14px] text-destructive/80">
                Отменено: {sale.cancelledAt ? formatDateTime(sale.cancelledAt) : 'неизвестно'}
              </p>
              <p className="mt-1 text-[14px] text-destructive/80">
                Причина: {sale.cancellationReason || 'не указана'}
              </p>
            </div>
          )}

          {/* Cannot Cancel Info */}
          {!isCancelled && !canBeCancelled && (
            <div className="rounded-2xl bg-secondary/60 px-6 py-4 text-[15px] text-muted-foreground ring-1 ring-border">
              <p className="flex items-center gap-2 font-semibold">
                <RotateCcw className="size-5" />
                Нельзя отменить продажу
              </p>
              <p className="mt-1 text-[14px]">
                Продажу можно отменить только в течение 24 часов с момента оформления.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="size-6" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-2xl font-bold text-foreground">Отменить продажу?</h3>
            <p className="mb-6 text-center text-[15px] text-muted-foreground">
              Продажа #{sale.id} на сумму {fmt(sale.total)}. Отменить можно только в течение 24 часов.
            </p>
            <div className="mb-6">
              <label className="mb-2 block text-[15px] font-semibold text-foreground">Причина отмены</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Опишите причину отмены..."
                rows={4}
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-destructive/40"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="rounded-2xl bg-secondary px-6 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/80"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitCancel}
                disabled={isCanceling}
                className="rounded-2xl bg-destructive px-6 py-3 text-[15px] font-bold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isCanceling ? 'Отмена...' : 'Отменить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="size-6" />
              </div>
            </div>
            <h3 className="mb-2 text-center text-2xl font-bold text-foreground">Отправить чек на email</h3>
            <p className="mb-6 text-center text-[15px] text-muted-foreground">
              Чек продажи #{sale.id} на сумму {fmt(sale.total)} будет отправлен на указанный email.
            </p>
            <div className="mb-6">
              <label className="mb-2 block text-[15px] font-semibold text-foreground">Email получателя</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="rounded-2xl bg-secondary px-6 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/80"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitEmail}
                disabled={isSendingEmail}
                className="rounded-2xl bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSendingEmail ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component wrapper for route
export function SaleDetailPageWrapper({ saleId }: { saleId: string }) {
  return <SaleDetailPage saleId={saleId} />
}
