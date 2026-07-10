'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { readProducts, writeProducts, type CatalogProduct } from '@/lib/erp/product-catalog'
import { readSuppliers } from '@/lib/erp/erp-store'

type Action = 'activate' | 'deactivate' | 'category' | 'supplier' | null

export function BulkActionsModal({
  selectedIds,
  onClose,
  onApply,
}: {
  selectedIds: string[]
  onClose: () => void
  onApply: () => void
}) {
  const [action, setAction] = useState<Action>(null)
  const [category, setCategory] = useState('')
  const [supplier, setSupplier] = useState('')
  const [error, setError] = useState('')

  const suppliers = readSuppliers().map((s) => s.name)
  const products = readProducts()
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[]

  function handleApply() {
    if (!action) {
      setError('Выберите действие')
      return
    }

    if (action === 'category' && !category.trim()) {
      setError('Выберите категорию')
      return
    }

    if (action === 'supplier' && !supplier.trim()) {
      setError('Выберите поставщика')
      return
    }

    const updated = products.map((p) => {
      if (!selectedIds.includes(p.id)) return p

      switch (action) {
        case 'activate':
          return { ...p, status: 'active' as const }
        case 'deactivate':
          return { ...p, status: 'inactive' as const }
        case 'category':
          return { ...p, category: category.trim() }
        case 'supplier':
          return { ...p, supplier: supplier.trim() }
        default:
          return p
      }
    })

    writeProducts(updated)
    onApply()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 border-b border-border p-6">
          <h2 className="text-2xl font-black text-foreground">Массовые действия</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <p className="text-[15px] font-semibold text-foreground">
              Выбрано товаров: <span className="text-primary">{selectedIds.length}</span>
            </p>
          </div>

          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-semibold text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[15px] font-semibold text-foreground">Действие</p>
            <div className="space-y-2">
              {[
                { value: 'activate' as const, label: 'Активировать' },
                { value: 'deactivate' as const, label: 'Деактивировать' },
                { value: 'category' as const, label: 'Изменить категорию' },
                { value: 'supplier' as const, label: 'Изменить поставщика' },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="action"
                    value={opt.value}
                    checked={action === opt.value}
                    onChange={() => {
                      setAction(opt.value)
                      setError('')
                    }}
                    className="size-5 rounded-full border border-border accent-primary"
                  />
                  <span className="text-[15px] font-medium text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {action === 'category' && (
            <div className="space-y-3">
              <p className="text-[15px] font-semibold text-foreground">Категория</p>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}

          {action === 'supplier' && (
            <div className="space-y-3">
              <p className="text-[15px] font-semibold text-foreground">Поставщик</p>
              <div className="relative">
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Выберите поставщика</option>
                  {suppliers.map((sup) => (
                    <option key={sup} value={sup}>
                      {sup}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="flex gap-3 border-t border-border pt-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-secondary px-4 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Отмена
            </button>
            <button
              onClick={handleApply}
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
