'use client'

import { useEffect, useState } from 'react'
import { Plus, Power, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  readCashRegisters,
  readPaymentMethodSettings,
  upsertCashRegister,
  upsertPaymentMethodSetting,
  writeCashRegisters,
  writePaymentMethodSettings,
  type ErpCashRegister,
  type ErpPaymentMethodSetting,
} from '@/lib/erp/erp-store'

type Tab = 'registers' | 'methods'
type RegisterFormState = { name: string; store: string; channel: 'cash' | 'cashless' }

export function CashSettings() {
  const [tab, setTab] = useState<Tab>('registers')
  const [registers, setRegisters] = useState<ErpCashRegister[]>([])
  const [methods, setMethods] = useState<ErpPaymentMethodSetting[]>([])
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [showMethodForm, setShowMethodForm] = useState(false)
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({ name: '', store: '', channel: 'cash' })
  const [methodForm, setMethodForm] = useState({ label: '', hotkey: '', channel: 'cash' as ErpPaymentMethodSetting['channel'] })

  const load = () => {
    setRegisters(readCashRegisters())
    setMethods(readPaymentMethodSettings())
  }

  useEffect(() => {
    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  function handleAddRegister() {
    if (!registerForm.name.trim() || !registerForm.store.trim()) return
    upsertCashRegister({
      name: registerForm.name,
      store: registerForm.store,
      channel: registerForm.channel,
    })
    setRegisterForm({ name: '', store: '', channel: 'cash' })
    setShowRegisterForm(false)
  }

  function handleAddMethod() {
    if (!methodForm.label.trim() || !methodForm.hotkey.trim()) return
    upsertPaymentMethodSetting({
      label: methodForm.label,
      hotkey: methodForm.hotkey,
      channel: methodForm.channel,
      registerId: null,
      allowInPos: true,
    })
    setMethodForm({ label: '', hotkey: '', channel: 'cash' })
    setShowMethodForm(false)
  }

  function toggleRegister(register: ErpCashRegister) {
    const next = registers.map((item) =>
      item.id === register.id
        ? { ...item, status: item.status === 'active' ? 'inactive' as const : 'active' as const, updatedAt: new Date().toISOString() }
        : item,
    )
    writeCashRegisters(next)
    setRegisters(next)
  }

  function toggleMethod(method: ErpPaymentMethodSetting) {
    const next = methods.map((item) =>
      item.id === method.id
        ? { ...item, status: item.status === 'active' ? 'inactive' as const : 'active' as const, updatedAt: new Date().toISOString() }
        : item,
    )
    writePaymentMethodSettings(next)
    setMethods(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Кассы и платежи</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Управляйте кассами и способами оплаты
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
        {(['registers', 'methods'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              'rounded-xl py-3 text-[15px] font-semibold transition-colors',
              tab === item
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item === 'registers' ? 'Кассы' : 'Способы оплаты'}
          </button>
        ))}
      </div>

      {tab === 'registers' ? (
        <div className="space-y-4">
          {!showRegisterForm ? (
            <button
              onClick={() => setShowRegisterForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[15px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
            >
              <Plus className="size-5" />
              Добавить кассу
            </button>
          ) : (
            <RegisterForm
              form={registerForm}
              onChange={setRegisterForm}
              onSubmit={handleAddRegister}
              onClose={() => setShowRegisterForm(false)}
            />
          )}

          <div className="space-y-3">
            {registers.map((register) => (
              <div
                key={register.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
              >
                <div>
                  <p className="text-[15px] font-bold text-foreground">{register.name}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {register.store} · {register.channel === 'cash' ? 'Наличные' : 'Безналичные'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('rounded-full px-3 py-1 text-[13px] font-semibold', register.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                    {register.status === 'active' ? 'Активна' : 'Неактивна'}
                  </span>
                  <button
                    onClick={() => toggleRegister(register)}
                    aria-label="Переключить кассу"
                    className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-accent"
                  >
                    <Power className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!showMethodForm ? (
            <button
              onClick={() => setShowMethodForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[15px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
            >
              <Plus className="size-5" />
              Добавить способ оплаты
            </button>
          ) : (
            <MethodForm
              form={methodForm}
              onChange={setMethodForm}
              onSubmit={handleAddMethod}
              onClose={() => setShowMethodForm(false)}
            />
          )}

          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
              >
                <div>
                  <p className="text-[15px] font-bold text-foreground">{method.label}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {method.hotkey} · {methodChannelLabel(method.channel)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('rounded-full px-3 py-1 text-[13px] font-semibold', method.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                    {method.status === 'active' ? 'Активен' : 'Неактивен'}
                  </span>
                  <button
                    onClick={() => toggleMethod(method)}
                    aria-label="Переключить способ оплаты"
                    className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-accent"
                  >
                    <Power className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RegisterForm({
  form,
  onChange,
  onSubmit,
  onClose,
}: {
  form: RegisterFormState
  onChange: (form: RegisterFormState) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Название кассы" className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40" />
      <input value={form.store} onChange={(event) => onChange({ ...form, store: event.target.value })} placeholder="Магазин" className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40" />
      <select value={form.channel} onChange={(event) => onChange({ ...form, channel: event.target.value as 'cash' | 'cashless' })} className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40">
        <option value="cash">Наличные</option>
        <option value="cashless">Безналичные</option>
      </select>
      <FormActions onSubmit={onSubmit} onClose={onClose} />
    </div>
  )
}

function MethodForm({
  form,
  onChange,
  onSubmit,
  onClose,
}: {
  form: { label: string; hotkey: string; channel: ErpPaymentMethodSetting['channel'] }
  onChange: (form: { label: string; hotkey: string; channel: ErpPaymentMethodSetting['channel'] }) => void
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <input value={form.label} onChange={(event) => onChange({ ...form, label: event.target.value })} placeholder="Название способа" className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40" />
      <input value={form.hotkey} onChange={(event) => onChange({ ...form, hotkey: event.target.value.toUpperCase() })} placeholder="Горячая клавиша (F1, F2...)" maxLength={2} className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40" />
      <select value={form.channel} onChange={(event) => onChange({ ...form, channel: event.target.value as ErpPaymentMethodSetting['channel'] })} className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40">
        <option value="cash">Наличные</option>
        <option value="cashless">Безналичные</option>
        <option value="credit">Долг клиента</option>
        <option value="mixed">Смешанная оплата</option>
      </select>
      <FormActions onSubmit={onSubmit} onClose={onClose} />
    </div>
  )
}

function FormActions({ onSubmit, onClose }: { onSubmit: () => void; onClose: () => void }) {
  return (
    <div className="flex gap-3">
      <button onClick={onSubmit} className="flex-1 rounded-2xl bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90">
        Добавить
      </button>
      <button onClick={onClose} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent">
        <X className="size-4" />
        Отмена
      </button>
    </div>
  )
}

function methodChannelLabel(channel: ErpPaymentMethodSetting['channel']) {
  if (channel === 'cash') return 'Наличные'
  if (channel === 'cashless') return 'Безналичные'
  if (channel === 'credit') return 'Долг клиента'
  return 'Смешанная оплата'
}
