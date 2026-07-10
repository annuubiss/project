'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Store, X } from 'lucide-react'
import {
  ERP_DATA_CHANGED,
  readCashRegisters,
  readWarehouses,
  upsertCashRegister,
  type ErpCashRegister,
} from '@/lib/erp/erp-store'

export function StoreSettings() {
  const [registers, setRegisters] = useState<ErpCashRegister[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [storeName, setStoreName] = useState('')

  const load = () => setRegisters(readCashRegisters())

  useEffect(() => {
    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const stores = useMemo(() => {
    const names = new Set(readWarehouses().map((warehouse) => warehouse.name))
    registers.forEach((register) => names.add(register.store))
    return Array.from(names)
  }, [registers])

  function addStore() {
    const name = storeName.trim()
    if (!name) return
    upsertCashRegister({
      name: `Касса ${name}`,
      store: name,
      channel: 'cash',
    })
    setStoreName('')
    setFormOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Магазины</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Управляйте локациями магазина и привязанными кассами
        </p>
      </div>

      <div className="space-y-3">
        {stores.map((store) => {
          const storeRegisters = registers.filter((register) => register.store === store)
          return (
            <div key={store} className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="size-6" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground">{store}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {storeRegisters.length} касс, активных: {storeRegisters.filter((register) => register.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {formOpen ? (
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex gap-3">
            <input
              autoFocus
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="Название магазина или склада"
              className="h-12 flex-1 rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={addStore}
              className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              <Save className="size-4" />
              Сохранить
            </button>
            <button
              onClick={() => {
                setFormOpen(false)
                setStoreName('')
              }}
              aria-label="Отмена"
              className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors hover:bg-accent"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[15px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Plus className="size-5" />
          Добавить магазин
        </button>
      )}
    </div>
  )
}
