'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { Plus, Pencil, Save, X, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  readCashRegisters,
  upsertCashRegister,
  type ErpCashRegister,
} from '@/lib/erp/erp-store'

function SettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-border py-8 lg:grid-cols-[220px_1fr] lg:gap-12">
      <h2 className="text-2xl font-black text-foreground">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export function CashRegisterSettings() {
  const [registers, setRegisters] = useState<ErpCashRegister[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({
    name: '',
    store: '',
    channel: 'cash' as 'cash' | 'cashless',
    status: 'active' as 'active' | 'inactive',
  })

  useEffect(() => {
    function load() {
      setRegisters(readCashRegisters())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  function resetDraft() {
    setEditingId(null)
    setDraft({ name: '', store: '', channel: 'cash', status: 'active' })
  }

  function startEdit(item: ErpCashRegister) {
    setEditingId(item.id)
    setDraft({
      name: item.name,
      store: item.store,
      channel: item.channel,
      status: item.status,
    })
  }

  function save() {
    if (!draft.name.trim() || !draft.store.trim()) return
    upsertCashRegister({
      id: editingId ?? undefined,
      name: draft.name,
      store: draft.store,
      channel: draft.channel,
      status: draft.status,
    })
    resetDraft()
  }

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Кассы</h1>

      <SettingsSection title="Список касс">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
            <div className="grid grid-cols-[1.2fr_1fr_120px_120px_96px] gap-4 border-b border-border px-6 py-4 text-[14px] font-semibold text-muted-foreground">
              <div>Название</div>
              <div>Магазин</div>
              <div>Канал</div>
              <div>Статус</div>
              <div className="text-right">Действие</div>
            </div>
            {registers.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.2fr_1fr_120px_120px_96px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0"
              >
                <div className="font-semibold text-foreground">{item.name}</div>
                <div className="text-[14px] text-muted-foreground">{item.store}</div>
                <div>
                  <span className={cn(
                    'inline-flex rounded-full px-3 py-1 text-[12px] font-bold',
                    item.channel === 'cash' ? 'bg-primary/10 text-primary' : 'bg-chart-5/15 text-chart-5',
                  )}>
                    {item.channel === 'cash' ? 'Наличные' : 'Безналичные'}
                  </span>
                </div>
                <div>
                  <span className={cn(
                    'inline-flex rounded-full px-3 py-1 text-[12px] font-bold',
                    item.status === 'active' ? 'bg-chart-2/15 text-chart-2' : 'bg-secondary text-muted-foreground',
                  )}>
                    {item.status === 'active' ? 'Активна' : 'Отключена'}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={resetDraft}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card px-6 py-4 text-[15px] font-semibold text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-accent"
          >
            <Plus className="size-5" />
            Добавить кассу
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title={editingId ? 'Редактирование' : 'Новая касса'}>
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-foreground">Название</label>
              <input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Касса Магазин обуви"
                className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-foreground">Магазин</label>
              <input
                value={draft.store}
                onChange={(event) => setDraft((prev) => ({ ...prev, store: event.target.value }))}
                placeholder="Магазин обуви"
                className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-foreground">Канал</label>
              <div className="flex overflow-hidden rounded-2xl bg-secondary p-1.5 ring-1 ring-border">
                {(['cash', 'cashless'] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, channel }))}
                    className={cn(
                      'flex-1 rounded-xl px-6 py-3 text-[15px] font-semibold transition-colors',
                      draft.channel === channel
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {channel === 'cash' ? 'Наличные' : 'Безналичные'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-foreground">Статус</label>
              <div className="flex overflow-hidden rounded-2xl bg-secondary p-1.5 ring-1 ring-border">
                {(['active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, status }))}
                    className={cn(
                      'flex-1 rounded-xl px-6 py-3 text-[15px] font-semibold transition-colors',
                      draft.status === status
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {status === 'active' ? 'Активна' : 'Отключена'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-2xl bg-secondary px-6 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <X className="mr-2 inline size-4" />
              Отмена
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-2xl bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              <Save className="mr-2 inline size-4" />
              Сохранить
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-foreground">Связь с финансами</p>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Активные кассы используются в финансовых операциях и могут назначаться способам оплаты.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}
