'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, Plus, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUZS, type CatalogProduct } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  getActivePosPaymentMethods,
  type ErpPaymentMethodSetting,
  type ErpSalePayment,
} from '@/lib/erp/erp-store'

type CartLine = { product: CatalogProduct; qty: number }
type Payment = ErpSalePayment

export function PaymentView({
  lines,
  total,
  discount,
  orderNumber,
  client,
  seller,
  wholesale,
  onBack,
  onComplete,
}: {
  lines: CartLine[]
  total: number
  discount: number
  orderNumber: string
  client: string | null
  seller: string
  wholesale?: boolean
  onBack: () => void
  onComplete: (payments: ErpSalePayment[]) => void
}) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<ErpPaymentMethodSetting[]>([])

  useEffect(() => {
    function load() {
      setPaymentMethods(getActivePosPaymentMethods())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const paid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, total - paid)

  const addPayment = (methodId: string, label: string) => {
    setPayments((prev) => [
      ...prev,
      { id: `${methodId}-${Date.now()}`, methodId, label, amount: remaining },
    ])
  }

  const updateAmount = (id: string, amount: number) =>
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, amount } : p)))

  const removePayment = (id: string) =>
    setPayments((prev) => prev.filter((p) => p.id !== id))

  const subtotal = total + discount

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      {/* Receipt preview */}
      <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-3 border-b border-dashed border-border pb-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
            Z
          </div>
          <span className="text-2xl font-black tracking-tight text-foreground">
            BILLZ
          </span>
        </div>

        <dl className="space-y-1.5 border-b border-dashed border-border py-4 text-[13px] text-muted-foreground">
          <div className="flex justify-between">
            <dt>Транзакция:</dt>
            <dd className="font-semibold text-foreground">#{orderNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Магазин:</dt>
            <dd className="font-semibold text-foreground">Магазин / Подвал</dd>
          </div>
          <div className="flex justify-between">
            <dt>Кассир:</dt>
            <dd className="font-semibold text-foreground">{seller}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Клиент:</dt>
            <dd className="font-semibold text-foreground">{client ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Тип продажи:</dt>
            <dd className="font-semibold text-foreground">
              {wholesale ? 'Оптовая' : 'Розничная'}
            </dd>
          </div>
        </dl>

        <div className="space-y-3 border-b border-dashed border-border py-4">
          {lines.map((l, i) => (
            <div key={l.product.id} className="text-[13px]">
              <p className="font-semibold text-foreground">
                {i + 1}. {l.product.name}
              </p>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {l.qty} шт x {formatUZS(wholesale ? l.product.wholesalePrice || l.product.price : l.product.price)}
                </span>
                <span className="font-semibold text-foreground">
                  {formatUZS(l.qty * (wholesale ? l.product.wholesalePrice || l.product.price : l.product.price))} UZS
                </span>
              </div>
            </div>
          ))}
        </div>

        <dl className="space-y-1.5 pt-4 text-[13px]">
          <div className="flex justify-between text-muted-foreground">
            <dt>Подитог</dt>
            <dd className="font-semibold text-foreground">{formatUZS(subtotal)} UZS</dd>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <dt>Скидка</dt>
            <dd className="font-semibold text-foreground">{formatUZS(discount)} UZS</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-black text-foreground">
            <dt>ИТОГО</dt>
            <dd>{formatUZS(total)} UZS</dd>
          </div>
        </dl>
      </div>

      {/* Payment area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl bg-card px-5 py-3 text-[15px] font-semibold text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="size-5" />
            Назад
            <kbd className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-foreground ring-1 ring-border">
              B
            </kbd>
          </button>
          <button
            onClick={() => onComplete(payments)}
            disabled={remaining > 0}
            className="rounded-2xl bg-primary px-8 py-3 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Оплатить
          </button>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div>
            <p className="text-[15px] text-muted-foreground">Итого:</p>
            <p className="text-3xl font-black text-foreground">
              {formatUZS(total)} UZS
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] text-muted-foreground">К оплате:</p>
            <p className="text-3xl font-black text-emerald-500">
              {formatUZS(remaining)} UZS
            </p>
          </div>
        </div>

        {/* Methods grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paymentMethods.map((m) => (
            <button
              key={m.id}
              onClick={() => addPayment(m.id, m.label)}
              className="group flex items-center justify-between rounded-2xl bg-card px-5 py-4 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-accent hover:text-primary"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                  <span className="text-xs font-bold">{m.label[0]}</span>
                </span>
                {m.label}
                <kbd className="flex h-5 items-center rounded-md bg-secondary px-1.5 text-[11px] font-semibold text-muted-foreground">
                  {m.hotkey}
                </kbd>
              </span>
              <Plus className="size-5 text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
          <div className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border">
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                <User className="size-4" />
              </span>
              <span className="flex flex-col leading-tight">
                Баланс
                <span className="text-xs font-normal text-muted-foreground">
                  0 UZS
                </span>
              </span>
            </span>
          </div>
        </div>

        {/* Active payments */}
        {payments.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-card shadow-sm ring-1 ring-border"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-[15px] font-semibold text-foreground">
                    {p.label}
                  </span>
                  <button
                    aria-label="Удалить"
                    onClick={() => removePayment(p.id)}
                    className="text-danger transition-colors hover:text-danger/80"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <input
                  type="number"
                  value={p.amount}
                  onChange={(e) =>
                    updateAmount(p.id, Math.max(0, Number(e.target.value) || 0))
                  }
                  className={cn(
                    'w-full rounded-b-2xl bg-transparent px-4 py-4 text-center text-xl font-bold text-foreground outline-none',
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
